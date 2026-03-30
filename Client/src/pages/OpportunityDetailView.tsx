import React, { useEffect, useMemo, useState } from 'react';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import BookmarkRoundedIcon from '@mui/icons-material/BookmarkRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Link,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { divIcon } from 'leaflet';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { useAuth } from '../components/AuthContext';
import { applicationService, opportunityService } from '../services/api';
import type { Opportunity } from '../types';
import {
  FAVORITES_UPDATED_EVENT,
  getFavoriteOpportunityIds,
  toggleFavoriteOpportunity,
} from '../utils/favorites';
import { getErrorMessage } from '../utils/http';
import {
  formatDate,
  formatOpportunityType,
  formatSalary,
  formatWorkFormat,
  getOpportunityLocation,
  getOpportunityTimeline,
  getOpportunityTone,
  splitTags,
} from '../utils/opportunity';

const OpportunityDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(getFavoriteOpportunityIds());

  useEffect(() => {
    if (!id) {
      setError('Карточка возможности не найдена.');
      setLoading(false);
      return;
    }

    const loadOpportunity = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await opportunityService.getById(id);
        setOpportunity(result);
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Не удалось загрузить карточку возможности.'));
      } finally {
        setLoading(false);
      }
    };

    loadOpportunity();
  }, [id]);

  useEffect(() => {
    const syncFavorites = () => setFavoriteIds(getFavoriteOpportunityIds());
    window.addEventListener(FAVORITES_UPDATED_EVENT, syncFavorites);
    return () => window.removeEventListener(FAVORITES_UPDATED_EVENT, syncFavorites);
  }, []);

  const isFavorite = useMemo(
    () => (opportunity ? favoriteIds.includes(opportunity.id) : false),
    [favoriteIds, opportunity],
  );

  const toggleFavorite = () => {
    if (!opportunity) {
      return;
    }

    setFavoriteIds(toggleFavoriteOpportunity(opportunity.id));
  };

  const handleApply = async () => {
    if (!opportunity) {
      return;
    }

    try {
      await applicationService.create({ opportunityId: opportunity.id });
      setSuccess('Отклик отправлен. Работодатель увидит его в личном кабинете.');
      setError('');
    } catch (applyError) {
      setError(getErrorMessage(applyError, 'Не удалось отправить отклик.'));
      setSuccess('');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={240} />
          <Skeleton variant="rounded" height={420} />
        </Stack>
      </Container>
    );
  }

  if (!opportunity) {
    return (
      <Container maxWidth="md" sx={{ py: 5 }}>
        <Alert severity="error">{error || 'Карточка возможности не найдена.'}</Alert>
      </Container>
    );
  }

  const tags = splitTags(opportunity.tags);
  const tone = getOpportunityTone(opportunity.type);
  const markerIcon = divIcon({
    className: '',
    html: `<span class="tr-marker ${tone.markerClassName}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 }, pb: 8 }}>
      <Stack spacing={3}>
        <Paper
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 8,
            overflow: 'hidden',
            background: `
              radial-gradient(circle at top right, rgba(45,212,191,0.16), transparent 25%),
              radial-gradient(circle at bottom left, rgba(249,115,22,0.14), transparent 24%),
              rgba(255,252,247,0.84)
            `,
          }}
        >
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={formatOpportunityType(opportunity.type)}
                sx={{ backgroundColor: tone.surface, color: tone.text }}
              />
              <Chip label={formatWorkFormat(opportunity.workFormat)} variant="outlined" />
              {opportunity.employer?.isVerified && (
                <Chip label="Проверенный работодатель" color="success" icon={<VerifiedRoundedIcon />} />
              )}
              {opportunity.isVerifiedOnly && <Chip label="Только для верифицированных профилей" variant="outlined" />}
            </Stack>

            <Box>
              <Typography variant="h2" gutterBottom>
                {opportunity.title}
              </Typography>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ color: 'text.secondary' }}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <BusinessRoundedIcon sx={{ fontSize: 18 }} />
                  <Typography>{opportunity.companyName}</Typography>
                </Stack>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <LocationOnRoundedIcon sx={{ fontSize: 18 }} />
                  <Typography>{getOpportunityLocation(opportunity)}</Typography>
                </Stack>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />
                  <Typography>{getOpportunityTimeline(opportunity)}</Typography>
                </Stack>
              </Stack>
            </Box>

            <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 860 }}>
              {opportunity.shortDescription}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {tags.map((tag) => (
                <Chip key={tag} label={tag} />
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
            gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.2fr) minmax(340px, 0.8fr)' },
          }}
        >
          <Stack spacing={3}>
            {opportunity.mediaUrl && (
              <Paper sx={{ borderRadius: 7, overflow: 'hidden' }}>
                <Box
                  component="img"
                  src={opportunity.mediaUrl}
                  alt={opportunity.title}
                  sx={{ width: '100%', maxHeight: 420, objectFit: 'cover' }}
                />
              </Paper>
            )}

            <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 7 }}>
              <Stack spacing={2.5}>
                <Typography variant="h4">О возможности</Typography>
                {(opportunity.fullDescription || opportunity.shortDescription)
                  .split('\n')
                  .filter((line) => line.trim().length > 0)
                  .map((paragraph, index) => (
                    <Typography key={`${paragraph}-${index}`} color="text.secondary">
                      {paragraph}
                    </Typography>
                  ))}
              </Stack>
            </Paper>

            {typeof opportunity.latitude === 'number' && typeof opportunity.longitude === 'number' && (
              <Paper sx={{ p: 1.25, borderRadius: 7 }}>
                <Box sx={{ height: 320 }}>
                  <MapContainer
                    center={[opportunity.latitude, opportunity.longitude]}
                    zoom={12}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[opportunity.latitude, opportunity.longitude]} icon={markerIcon} />
                  </MapContainer>
                </Box>
              </Paper>
            )}
          </Stack>

          <Stack spacing={3} sx={{ position: { xl: 'sticky' }, top: { xl: 110 } }}>
            <Paper sx={{ p: 3, borderRadius: 7 }}>
              <Stack spacing={2}>
                <Typography variant="h5">{formatSalary(opportunity.salaryFrom, opportunity.salaryTo)}</Typography>
                <Typography color="text.secondary">
                  Опубликовано {formatDate(opportunity.publishedAt)}
                </Typography>
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
                  {opportunity.externalUrl && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LanguageRoundedIcon color="primary" />
                      <Link href={opportunity.externalUrl} target="_blank" rel="noreferrer">
                        Открыть внешний ресурс
                      </Link>
                    </Stack>
                  )}
                </Stack>
                <Stack spacing={1.25}>
                  {isAuthenticated && user?.roles.includes('Applicant') ? (
                    <Button variant="contained" onClick={handleApply}>
                      Откликнуться
                    </Button>
                  ) : (
                    <Button variant="contained" onClick={() => navigate('/login')}>
                      Войти, чтобы откликнуться
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    startIcon={isFavorite ? <BookmarkRoundedIcon /> : <BookmarkBorderRoundedIcon />}
                    onClick={toggleFavorite}
                  >
                    {isFavorite ? 'Сохранено в браузере' : 'Сохранить в избранное'}
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 7 }}>
              <Stack spacing={1.5}>
                <Typography variant="h6">О работодателе</Typography>
                <Typography fontWeight={700}>{opportunity.employer?.companyName ?? opportunity.companyName}</Typography>
                {opportunity.employer?.description && (
                  <Typography color="text.secondary">{opportunity.employer.description}</Typography>
                )}
                {opportunity.employer?.websiteUrl && (
                  <Link href={opportunity.employer.websiteUrl} target="_blank" rel="noreferrer">
                    Сайт компании
                  </Link>
                )}
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 7 }}>
              <Typography variant="h6" gutterBottom>
                Продолжить исследование
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Вернитесь к общей карте и посмотрите похожие карточки по тегам и формату.
              </Typography>
              <Button component={RouterLink} to="/" variant="outlined" fullWidth>
                Вернуться к каталогу
              </Button>
            </Paper>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};

export default OpportunityDetailView;
