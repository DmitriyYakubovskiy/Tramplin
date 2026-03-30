import { useEffect, useMemo, useState } from 'react';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import ViewAgendaRoundedIcon from '@mui/icons-material/ViewAgendaRounded';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import YandexMap, { type YandexMapMarker } from '../components/maps/YandexMap';
import OpportunityTile from '../components/OpportunityTile';
import { favoritesService, opportunityService, profileService, recommendationsService } from '../services/api';
import type { ApplicantProfile, EmployerProfile, Favorite, Opportunity, OpportunityType, RecommendedFeedItem, WorkFormat } from '../types';
import {
  FAVORITES_UPDATED_EVENT,
  getFavoriteEmployerIds,
  getFavoriteOpportunityIds,
  toggleFavoriteOpportunity,
} from '../utils/favorites';
import { getErrorMessage, getErrorStatus } from '../utils/http';
import { buildOpportunityMapBalloonHtml, buildOpportunityMapHintHtml } from '../utils/mapHtml';
import { getOpportunityCoordinates } from '../utils/map';
import { getOpportunityAccent, opportunityTypeLabel, splitTags, workFormatLabel } from '../utils/presentation';

type ViewMode = 'map' | 'list';
type HeroProfileState = 'guest' | 'missing' | 'incomplete' | 'ready';

const DEFAULT_CENTER: [number, number] = [55.751244, 37.618423];

const mapRecommendedItemToOpportunity = (item: RecommendedFeedItem): Opportunity => ({
  id: item.id,
  title: item.title,
  shortDescription: item.shortDescription,
  fullDescription: item.shortDescription,
  type: item.type,
  workFormat: item.workFormat,
  status: item.status,
  companyName: item.employer?.companyName ?? item.companyName,
  city: item.city,
  salaryFrom: item.salaryFrom,
  salaryTo: item.salaryTo,
  contactEmail: '',
  tags: item.tags,
  publishedAt: item.publishedAt,
  expiresAt: item.expiresAt,
  isVerifiedOnly: item.isVerifiedOnly,
  employer: item.employer
    ? {
        id: item.employer.id,
        companyName: item.employer.companyName,
        logoUrl: item.employer.logoUrl,
        isVerified: item.employer.isVerified,
      }
    : null,
});

const isApplicantProfileReady = (profile: ApplicantProfile) =>
  [profile.fullName, profile.university, profile.faculty, profile.courseOrGraduationYear, profile.city, profile.skills].every((value) =>
    value.trim(),
  );

const isEmployerProfileReady = (profile: EmployerProfile) =>
  [profile.companyName, profile.city ?? '', profile.verificationMethod ?? '', profile.verificationData ?? ''].every((value) => value.trim());

const HomeScreen = () => {
  const { isAuthenticated, user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [guestFavoriteOpportunityIds, setGuestFavoriteOpportunityIds] = useState<string[]>(getFavoriteOpportunityIds());
  const [guestFavoriteEmployerIds, setGuestFavoriteEmployerIds] = useState<string[]>(getFavoriteEmployerIds());
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState<OpportunityType | ''>('');
  const [workFormat, setWorkFormat] = useState<WorkFormat | ''>('');
  const [tag, setTag] = useState('');
  const [salaryFrom, setSalaryFrom] = useState('');
  const [salaryTo, setSalaryTo] = useState('');
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);
  const [recommendedItems, setRecommendedItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [heroProfileState, setHeroProfileState] = useState<HeroProfileState>('guest');

  const isApplicant = isAuthenticated && user?.roles.includes('Applicant');
  const isEmployer = isAuthenticated && user?.roles.includes('Employer');
  const isModerator = isAuthenticated && (user?.roles.includes('Curator') || user?.roles.includes('Admin'));

  useEffect(() => {
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

      const loadHeroProfileState = async (): Promise<HeroProfileState> => {
        if (!isAuthenticated) {
          return 'guest';
        }

        if (isApplicant) {
          try {
            const profile = await profileService.getApplicantProfile();
            return isApplicantProfileReady(profile) ? 'ready' : 'incomplete';
          } catch (loadError) {
            return getErrorStatus(loadError) === 404 ? 'missing' : 'ready';
          }
        }

        if (isEmployer) {
          try {
            const profile = await profileService.getEmployerProfile();
            return isEmployerProfileReady(profile) ? 'ready' : 'incomplete';
          } catch (loadError) {
            return getErrorStatus(loadError) === 404 ? 'missing' : 'ready';
          }
        }

        return 'ready';
      };

      try {
        const [opportunitiesData, favoritesData, nextHeroProfileState] = await Promise.all([
          opportunityService.getAll(),
          loadFavorites(),
          loadHeroProfileState(),
        ]);

        setOpportunities(opportunitiesData);
        setFavorites(favoritesData);
        setHeroProfileState(nextHeroProfileState);
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Не удалось загрузить возможности платформы.'));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [isApplicant, isAuthenticated, isEmployer]);

  useEffect(() => {
    const syncGuestFavorites = () => {
      setGuestFavoriteOpportunityIds(getFavoriteOpportunityIds());
      setGuestFavoriteEmployerIds(getFavoriteEmployerIds());
    };

    window.addEventListener(FAVORITES_UPDATED_EVENT, syncGuestFavorites);
    return () => window.removeEventListener(FAVORITES_UPDATED_EVENT, syncGuestFavorites);
  }, []);

  useEffect(() => {
    if (!isApplicant) {
      setRecommendedItems([]);
      setShowRecommendedOnly(false);
      return;
    }

    let cancelled = false;

    const loadRecommendations = async () => {
      try {
        const data = await recommendationsService.getFeed(20);
        if (!cancelled) {
          setRecommendedItems((data.items ?? []).map(mapRecommendedItemToOpportunity));
        }
      } catch {
        if (!cancelled) {
          setRecommendedItems([]);
        }
      }
    };

    void loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [isApplicant]);

  const favoriteOpportunityIds = useMemo(
    () => (isApplicant ? favorites.filter((item) => item.type === 'Opportunity' && item.opportunity).map((item) => item.opportunity!.id) : guestFavoriteOpportunityIds),
    [favorites, guestFavoriteOpportunityIds, isApplicant],
  );

  const favoriteEmployerIds = useMemo(
    () => (isApplicant ? favorites.filter((item) => item.type === 'Employer' && item.employer).map((item) => item.employer!.id) : guestFavoriteEmployerIds),
    [favorites, guestFavoriteEmployerIds, isApplicant],
  );

  const cities = useMemo(
    () => Array.from(new Set(opportunities.map((item) => item.city).filter(Boolean))).sort((left, right) => left.localeCompare(right, 'ru')),
    [opportunities],
  );

  const popularTags = useMemo(() => {
    const counts = new Map<string, number>();

    opportunities.forEach((item) => {
      splitTags(item.tags).forEach((itemTag) => {
        counts.set(itemTag, (counts.get(itemTag) ?? 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 10)
      .map(([itemTag]) => itemTag);
  }, [opportunities]);

  const filteredOpportunities = useMemo(() => {
    const minSalary = salaryFrom ? Number(salaryFrom) : null;
    const maxSalary = salaryTo ? Number(salaryTo) : null;
    const sourceItems = showRecommendedOnly ? recommendedItems : opportunities;

    return sourceItems.filter((item) => {
      const haystack = [item.title, item.shortDescription, item.companyName, item.tags].join(' ').toLowerCase();
      const matchesSearch = !search || haystack.includes(search.toLowerCase());
      const matchesCity = !city || item.city === city;
      const matchesType = !type || item.type === type;
      const matchesFormat = !workFormat || item.workFormat === workFormat;
      const matchesTag = !tag || splitTags(item.tags).includes(tag);
      const upperSalary = item.salaryTo ?? item.salaryFrom ?? 0;
      const lowerSalary = item.salaryFrom ?? item.salaryTo ?? 0;
      const matchesSalaryFrom = minSalary == null || upperSalary >= minSalary;
      const matchesSalaryTo = maxSalary == null || lowerSalary <= maxSalary;

      return matchesSearch && matchesCity && matchesType && matchesFormat && matchesTag && matchesSalaryFrom && matchesSalaryTo;
    });
  }, [city, opportunities, recommendedItems, salaryFrom, salaryTo, search, showRecommendedOnly, tag, type, workFormat]);

  const mapMarkers = useMemo(
    () => {
      const nextMarkers: YandexMapMarker[] = [];

      filteredOpportunities.forEach((item) => {
        const coordinates = getOpportunityCoordinates(item);
        if (!coordinates) {
          return;
        }

        const accent = getOpportunityAccent(item.type);
        const isFavorite =
          favoriteOpportunityIds.includes(item.id) ||
          (item.employer?.id ? favoriteEmployerIds.includes(item.employer.id) : false);

        nextMarkers.push({
          id: item.id,
          coordinates,
          markerClassName: `${accent.markerClassName}${isFavorite ? ' marker-favorite' : ''}`,
          hintHtml: buildOpportunityMapHintHtml(item),
          balloonHtml: buildOpportunityMapBalloonHtml(item),
        });
      });

      return nextMarkers;
    },
    [favoriteEmployerIds, favoriteOpportunityIds, filteredOpportunities],
  );

  const handleToggleFavorite = async (opportunity: Opportunity) => {
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
        const next = await favoritesService.create({ type: 'Opportunity', opportunityId: opportunity.id });
        setFavorites((current) => [next, ...current]);
      }
    } catch (favoriteError) {
      setError(getErrorMessage(favoriteError, 'Не удалось обновить избранное.'));
    }
  };

  const resetFilters = () => {
    setSearch('');
    setCity('');
    setType('');
    setWorkFormat('');
    setTag('');
    setSalaryFrom('');
    setSalaryTo('');
    setShowRecommendedOnly(false);
  };

  const heroAction = useMemo(() => {
    if (!isAuthenticated) {
      return {
        primaryLabel: 'Создать профиль',
        primaryTo: '/register',
        secondaryLabel: 'Войти',
        secondaryTo: '/login',
        helperText: '',
      };
    }

    if (isApplicant) {
      if (heroProfileState === 'missing' || heroProfileState === 'incomplete') {
        return {
          primaryLabel: 'Заполнить профиль',
          primaryTo: '/dashboard',
          helperText:
            'Чтобы откликаться, сохранять вакансии и строить сеть контактов, заполните профиль соискателя.',
        };
      }

      return {
        primaryLabel: 'Обновить профиль',
        primaryTo: '/dashboard',
        helperText:
          'Профиль уже создан — здесь можно обновить резюме, навыки и настройки приватности.',
      };
    }

    if (isEmployer) {
      if (heroProfileState === 'missing' || heroProfileState === 'incomplete') {
        return {
          primaryLabel: 'Заполнить профиль компании',
          primaryTo: '/dashboard',
          helperText:
            'После заполнения профиля и верификации можно публиковать вакансии, стажировки и мероприятия.',
        };
      }

      return {
        primaryLabel: 'Обновить профиль компании',
        primaryTo: '/dashboard',
        helperText:
          'Поддерживайте описание компании и данные для верификации актуальными.',
      };
    }

    if (isModerator) {
      return {
        primaryLabel: 'Открыть кабинет',
        primaryTo: '/dashboard',
        helperText:
          'В кабинете доступны модерация, верификация работодателей и управление контентом платформы.',
      };
    }

    return {
      primaryLabel: 'Открыть кабинет',
      primaryTo: '/dashboard',
      helperText: '',
    };
  }, [heroProfileState, isApplicant, isAuthenticated, isEmployer, isModerator]);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 }, pb: { xs: 5, md: 8 } }}>
      <Stack spacing={3}>
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 7 }}>
          <Stack spacing={2}>
            <Chip label="Трамплин" color="secondary" sx={{ alignSelf: 'flex-start' }} />
            <Typography variant="h2">Единая карьерная экосистема для студентов, выпускников и IT-компаний.</Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 900 }}>
              На платформе собраны вакансии, стажировки, менторские программы и карьерные события. Можно искать по карте и ленте, фильтровать по стеку и зарплате, сохранять интересные компании и строить свой карьерный маршрут с нуля.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button component={RouterLink} to={heroAction.primaryTo} variant="contained" sx={{ width: { xs: '100%', sm: 'auto' } }}>
                {heroAction.primaryLabel}
              </Button>
              {heroAction.secondaryLabel && heroAction.secondaryTo ? (
                <Button component={RouterLink} to={heroAction.secondaryTo} variant="outlined" sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  {heroAction.secondaryLabel}
                </Button>
              ) : null}
            </Stack>
            {heroAction.helperText ? (
              <Typography variant="body2" color="text.secondary">
                {heroAction.helperText}
              </Typography>
            ) : null}
          </Stack>
        </Paper>

        <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 7 }}>
          <Stack spacing={2.5}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography variant="h4">Поиск возможностей</Typography>
                <Typography color="text.secondary">Фильтруйте каталог по формату, стеку, городу и зарплатной вилке.</Typography>
              </Box>
              <ToggleButtonGroup
                exclusive
                value={viewMode}
                onChange={(_event, value: ViewMode | null) => value && setViewMode(value)}
                sx={{ width: { xs: '100%', md: 'auto' } }}
              >
                <ToggleButton value="map">
                  <MapRoundedIcon sx={{ mr: 1 }} />
                  Карта
                </ToggleButton>
                <ToggleButton value="list">
                  <ViewAgendaRoundedIcon sx={{ mr: 1 }} />
                  Лента
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
              }}
            >
              <TextField label="Поиск" value={search} onChange={(event) => setSearch(event.target.value)} />
              <TextField select label="Город" value={city} onChange={(event) => setCity(event.target.value)}>
                <MenuItem value="">Все города</MenuItem>
                {cities.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
              <TextField select label="Тип" value={type} onChange={(event) => setType(event.target.value as OpportunityType | '')}>
                <MenuItem value="">Все типы</MenuItem>
                {Object.entries(opportunityTypeLabel).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField select label="Формат" value={workFormat} onChange={(event) => setWorkFormat(event.target.value as WorkFormat | '')}>
                <MenuItem value="">Любой формат</MenuItem>
                {Object.entries(workFormatLabel).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField label="Зарплата от" type="number" value={salaryFrom} onChange={(event) => setSalaryFrom(event.target.value)} />
              <TextField label="Зарплата до" type="number" value={salaryTo} onChange={(event) => setSalaryTo(event.target.value)} />
              <TextField label="Тег" value={tag} onChange={(event) => setTag(event.target.value)} />
              {isApplicant ? (
                <FormControlLabel
                  control={<Checkbox checked={showRecommendedOnly} onChange={(event) => setShowRecommendedOnly(event.target.checked)} />}
                  label="Показать рекомендованные"
                  sx={{ mx: 0, alignSelf: 'center' }}
                />
              ) : (
                <Box />
              )}
              <Button variant="outlined" startIcon={<FilterAltRoundedIcon />} onClick={resetFilters} sx={{ width: { xs: '100%', xl: 'auto' } }}>
                Сбросить фильтры
              </Button>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {popularTags.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  color={tag === item ? 'primary' : 'default'}
                  variant={tag === item ? 'filled' : 'outlined'}
                  onClick={() => setTag((current) => (current === item ? '' : item))}
                />
              ))}
            </Stack>
          </Stack>
        </Paper>

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Paper sx={{ p: 4, borderRadius: 7 }}>
            <Typography color="text.secondary">Загружаем каталог возможностей...</Typography>
          </Paper>
        ) : filteredOpportunities.length === 0 ? (
          <Paper sx={{ p: 4, borderRadius: 7, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Ничего не найдено
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Попробуйте убрать часть фильтров или выбрать другой город.
            </Typography>
            <Button variant="contained" onClick={resetFilters}>
              Показать все
            </Button>
          </Paper>
        ) : viewMode === 'map' ? (
          <Stack spacing={2.5}>
            <Paper sx={{ p: 1.25, borderRadius: 7, height: { xs: 360, sm: 460, lg: 640 } }}>
              <YandexMap center={DEFAULT_CENTER} zoom={5} markers={mapMarkers} height="100%" />
            </Paper>

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
              }}
            >
              {filteredOpportunities.slice(0, 6).map((item) => (
                <OpportunityTile
                  key={item.id}
                  opportunity={item}
                  isFavorite={favoriteOpportunityIds.includes(item.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </Box>
          </Stack>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
            }}
          >
            {filteredOpportunities.map((item) => (
              <OpportunityTile
                key={item.id}
                opportunity={item}
                isFavorite={favoriteOpportunityIds.includes(item.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </Box>
        )}
      </Stack>
    </Container>
  );
};

export default HomeScreen;
