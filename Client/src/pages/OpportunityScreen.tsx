import { useEffect, useMemo, useState } from 'react';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import YandexMap from '../components/maps/YandexMap';
import {
  applicationService,
  contactsService,
  favoritesService,
  opportunityService,
  recommendationsService,
} from '../services/api';
import type { Contact, Favorite, Opportunity } from '../types';
import {
  FAVORITES_UPDATED_EVENT,
  getFavoriteEmployerIds,
  getFavoriteOpportunityIds,
  toggleFavoriteEmployer,
  toggleFavoriteOpportunity,
} from '../utils/favorites';
import { getErrorMessage, getErrorStatus } from '../utils/http';
import { buildOpportunityMapBalloonHtml, buildOpportunityMapHintHtml } from '../utils/mapHtml';
import { getOpportunityCoordinates } from '../utils/map';
import {
  formatDate,
  formatMoney,
  getOpportunityAccent,
  getOpportunityLocation,
  getOpportunityTimeline,
  opportunityStatusLabel,
  opportunityTypeLabel,
  splitTags,
  workFormatLabel,
} from '../utils/presentation';

const OpportunityScreen = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [guestFavoriteOpportunityIds, setGuestFavoriteOpportunityIds] = useState<string[]>(getFavoriteOpportunityIds());
  const [guestFavoriteEmployerIds, setGuestFavoriteEmployerIds] = useState<string[]>(getFavoriteEmployerIds());
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [recommendedApplicantProfileId, setRecommendedApplicantProfileId] = useState('');
  const [recommendationMessage, setRecommendationMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const isApplicant = isAuthenticated && user?.roles.includes('Applicant');

  useEffect(() => {
    if (!id) {
      setError('Карточка не найдена.');
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');

      const loadFavorites = async () => {
        if (!isApplicant) {
          return [] as Favorite[];
        }

        try {
          return await favoritesService.getMy();
        } catch (loadError) {
          if (getErrorStatus(loadError) === 400) {
            return [] as Favorite[];
          }

          throw loadError;
        }
      };

      const loadContacts = async () => {
        if (!isApplicant) {
          return [] as Contact[];
        }

        try {
          return await contactsService.getMy();
        } catch (loadError) {
          if (getErrorStatus(loadError) === 400) {
            return [] as Contact[];
          }

          throw loadError;
        }
      };

      try {
        const [opportunityData, favoritesData, contactsData] = await Promise.all([
          opportunityService.getById(id),
          loadFavorites(),
          loadContacts(),
        ]);

        setOpportunity(opportunityData);
        setFavorites(favoritesData);
        setContacts(contactsData.filter((item) => item.status === 'Accepted'));
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Не удалось загрузить карточку.'));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id, isApplicant]);

  useEffect(() => {
    const syncGuestFavorites = () => {
      setGuestFavoriteOpportunityIds(getFavoriteOpportunityIds());
      setGuestFavoriteEmployerIds(getFavoriteEmployerIds());
    };

    window.addEventListener(FAVORITES_UPDATED_EVENT, syncGuestFavorites);
    return () => window.removeEventListener(FAVORITES_UPDATED_EVENT, syncGuestFavorites);
  }, []);

  const favoriteOpportunityIds = useMemo(
    () => (isApplicant ? favorites.filter((item) => item.type === 'Opportunity' && item.opportunity).map((item) => item.opportunity!.id) : guestFavoriteOpportunityIds),
    [favorites, guestFavoriteOpportunityIds, isApplicant],
  );

  const favoriteEmployerIds = useMemo(
    () => (isApplicant ? favorites.filter((item) => item.type === 'Employer' && item.employer).map((item) => item.employer!.id) : guestFavoriteEmployerIds),
    [favorites, guestFavoriteEmployerIds, isApplicant],
  );

  const isOpportunityFavorite = opportunity ? favoriteOpportunityIds.includes(opportunity.id) : false;
  const isEmployerFavorite = opportunity?.employer?.id ? favoriteEmployerIds.includes(opportunity.employer.id) : false;

  const coordinates = opportunity ? getOpportunityCoordinates(opportunity) : null;
  const accent = opportunity ? getOpportunityAccent(opportunity.type) : null;

  const handleApply = async () => {
    if (!opportunity) {
      return;
    }

    try {
      await applicationService.create({ opportunityId: opportunity.id });
      setSuccess('Отклик отправлен.');
      setError('');
    } catch (applyError) {
      setError(getErrorMessage(applyError, 'Не удалось отправить отклик.'));
      setSuccess('');
    }
  };

  const handleToggleOpportunityFavorite = async () => {
    if (!opportunity) {
      return;
    }

    if (!isApplicant) {
      setGuestFavoriteOpportunityIds(toggleFavoriteOpportunity(opportunity.id));
      return;
    }

    const existing = favorites.find((item) => item.type === 'Opportunity' && item.opportunity?.id === opportunity.id);

    try {
      if (existing) {
        await favoritesService.delete(existing.id);
        setFavorites((current) => current.filter((item) => item.id !== existing.id));
      } else {
        const created = await favoritesService.create({ type: 'Opportunity', opportunityId: opportunity.id });
        setFavorites((current) => [created, ...current]);
      }
    } catch (favoriteError) {
      setError(getErrorMessage(favoriteError, 'Не удалось обновить избранное.'));
    }
  };

  const handleToggleEmployerFavorite = async () => {
    if (!opportunity?.employer?.id) {
      return;
    }

    if (!isApplicant) {
      setGuestFavoriteEmployerIds(toggleFavoriteEmployer(opportunity.employer.id));
      return;
    }

    const existing = favorites.find((item) => item.type === 'Employer' && item.employer?.id === opportunity.employer?.id);

    try {
      if (existing) {
        await favoritesService.delete(existing.id);
        setFavorites((current) => current.filter((item) => item.id !== existing.id));
      } else {
        const created = await favoritesService.create({ type: 'Employer', employerProfileId: opportunity.employer.id });
        setFavorites((current) => [created, ...current]);
      }
    } catch (favoriteError) {
      setError(getErrorMessage(favoriteError, 'Не удалось обновить список компаний.'));
    }
  };

  const handleRecommend = async () => {
    if (!opportunity || !recommendedApplicantProfileId) {
      return;
    }

    try {
      await recommendationsService.create({
        recommendedApplicantProfileId,
        opportunityId: opportunity.id,
        message: recommendationMessage,
      });
      setSuccess('Рекомендация отправлена контакту.');
      setRecommendationMessage('');
      setRecommendedApplicantProfileId('');
    } catch (recommendationError) {
      setError(getErrorMessage(recommendationError, 'Не удалось отправить рекомендацию.'));
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Paper sx={{ p: 4, borderRadius: 7 }}>
          <Typography color="text.secondary">Загружаем карточку...</Typography>
        </Paper>
      </Container>
    );
  }

  if (!opportunity) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Alert severity="error">{error || 'Карточка не найдена.'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 }, pb: { xs: 5, md: 8 } }}>
      <Stack spacing={3}>
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 7 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={opportunityTypeLabel[opportunity.type]} sx={{ backgroundColor: accent?.surface, color: accent?.color }} />
              <Chip label={workFormatLabel[opportunity.workFormat]} variant="outlined" />
              <Chip label={opportunityStatusLabel[opportunity.status]} variant="outlined" />
              {opportunity.employer?.isVerified && <Chip icon={<VerifiedRoundedIcon />} label="Проверенная компания" color="success" />}
            </Stack>
            <Typography variant="h2">{opportunity.title}</Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {opportunity.shortDescription}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {splitTags(opportunity.tags).map((item) => (
                <Chip key={item} label={item} variant="outlined" />
              ))}
            </Stack>
          </Stack>
        </Paper>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            alignItems: 'start',
            gridTemplateColumns: { xs: '1fr', xl: '1.15fr 0.85fr' },
          }}
        >
          <Stack spacing={3}>
            <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 7 }}>
              <Stack spacing={2}>
                <Typography variant="h4">О возможности</Typography>
                {(opportunity.fullDescription || opportunity.shortDescription)
                  .split('\n')
                  .filter((item) => item.trim())
                  .map((item) => (
                    <Typography key={item} color="text.secondary">
                      {item}
                    </Typography>
                  ))}
              </Stack>
            </Paper>

            {coordinates && accent && (
              <Paper sx={{ p: 1.25, borderRadius: 7 }}>
                <Box sx={{ height: { xs: 260, sm: 320 } }}>
                  <YandexMap
                    center={coordinates}
                    zoom={12}
                    fitToMarkers={false}
                    height="100%"
                    markers={[
                      {
                        id: opportunity.id,
                        coordinates,
                        markerClassName: accent.markerClassName,
                        hintHtml: buildOpportunityMapHintHtml(opportunity),
                        balloonHtml: buildOpportunityMapBalloonHtml(opportunity),
                      },
                    ]}
                  />
                </Box>
              </Paper>
            )}
          </Stack>

          <Stack spacing={3}>
            <Paper sx={{ p: 3, borderRadius: 7 }}>
              <Stack spacing={2}>
                <Typography variant="h5">{formatMoney(opportunity.salaryFrom, opportunity.salaryTo)}</Typography>
                <Typography color="text.secondary">{getOpportunityLocation(opportunity)}</Typography>
                <Typography color="text.secondary">{getOpportunityTimeline(opportunity)}</Typography>
                <Divider />
                <Stack spacing={1.25}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <MailOutlineRoundedIcon color="primary" />
                    <Typography>{opportunity.contactEmail}</Typography>
                  </Stack>
                  {opportunity.contactPhone && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PhoneRoundedIcon color="primary" />
                      <Typography>{opportunity.contactPhone}</Typography>
                    </Stack>
                  )}
                </Stack>
                <Stack spacing={1.25}>
                  {isApplicant ? (
                    <Button variant="contained" onClick={handleApply} fullWidth>
                      Откликнуться
                    </Button>
                  ) : (
                    <Button variant="contained" onClick={() => navigate('/login')} fullWidth>
                      Войти для отклика
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    startIcon={isOpportunityFavorite ? <StarRoundedIcon /> : <StarBorderRoundedIcon />}
                    onClick={handleToggleOpportunityFavorite}
                    fullWidth
                  >
                    {isOpportunityFavorite ? 'Убрать из избранного' : 'Сохранить карточку'}
                  </Button>
                  {opportunity.employer?.id && (
                    <Button
                      variant="outlined"
                      startIcon={isEmployerFavorite ? <StarRoundedIcon /> : <StarBorderRoundedIcon />}
                      onClick={handleToggleEmployerFavorite}
                      fullWidth
                    >
                      {isEmployerFavorite ? 'Компания в избранном' : 'Сохранить компанию'}
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 7 }}>
              <Stack spacing={1.5}>
                <Typography variant="h6">Работодатель</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <BusinessRoundedIcon color="primary" />
                  <Typography fontWeight={700}>{opportunity.employer?.companyName ?? opportunity.companyName}</Typography>
                </Stack>
                {opportunity.employer?.description && <Typography color="text.secondary">{opportunity.employer.description}</Typography>}
                {opportunity.employer?.websiteUrl && (
                  <Link href={opportunity.employer.websiteUrl} target="_blank" rel="noreferrer">
                    Открыть сайт компании
                  </Link>
                )}
                {opportunity.employer?.user?.email && (
                  <Typography color="text.secondary">Контакт компании: {opportunity.employer.user.email}</Typography>
                )}
              </Stack>
            </Paper>

            {isApplicant && contacts.length > 0 && (
              <Paper sx={{ p: 3, borderRadius: 7 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Рекомендовать контакту</Typography>
                  <TextField
                    select
                    label="Контакт"
                    value={recommendedApplicantProfileId}
                    onChange={(event) => setRecommendedApplicantProfileId(event.target.value)}
                  >
                    {contacts.map((item) => (
                      <MenuItem key={item.id} value={item.peer?.id}>
                        {item.peer?.fullName}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Комментарий"
                    value={recommendationMessage}
                    onChange={(event) => setRecommendationMessage(event.target.value)}
                    multiline
                    rows={3}
                  />
                  <Button variant="outlined" onClick={handleRecommend} disabled={!recommendedApplicantProfileId} fullWidth>
                    Отправить рекомендацию
                  </Button>
                </Stack>
              </Paper>
            )}

            <Paper sx={{ p: 3, borderRadius: 7 }}>
              <Typography variant="h6" gutterBottom>
                Продолжить поиск
              </Typography>
              <Button component={RouterLink} to="/" variant="outlined" fullWidth>
                Вернуться к каталогу
              </Button>
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                Дата публикации: {formatDate(opportunity.publishedAt)}
              </Typography>
            </Paper>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};

export default OpportunityScreen;
