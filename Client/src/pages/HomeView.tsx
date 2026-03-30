import React, { useEffect, useMemo, useState } from 'react';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import BookmarkAddedRoundedIcon from '@mui/icons-material/BookmarkAddedRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import LocationCityRoundedIcon from '@mui/icons-material/LocationCityRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded';
import { alpha } from '@mui/material/styles';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import L, { divIcon } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import OpportunityCard from '../components/OpportunityCard';
import heroImage from '../assets/hero.png';
import type { Opportunity } from '../types';
import { opportunityService } from '../services/api';
import {
  FAVORITES_UPDATED_EVENT,
  getFavoriteOpportunityIds,
  toggleFavoriteOpportunity,
} from '../utils/favorites';
import { getErrorMessage } from '../utils/http';
import {
  formatOpportunityType,
  formatSalary,
  formatWorkFormat,
  getOpportunityTone,
  splitTags,
} from '../utils/opportunity';

type ViewMode = 'map' | 'list';

const defaultCenter: [number, number] = [55.751244, 37.618423];

const buildMarkerIcon = (opportunity: Opportunity, isFavorite: boolean) =>
  divIcon({
    className: '',
    html: `<span class="tr-marker ${getOpportunityTone(opportunity.type).markerClassName}${isFavorite ? ' marker-favorite' : ''}"></span>`,
    iconSize: isFavorite ? [22, 22] : [18, 18],
    iconAnchor: isFavorite ? [11, 11] : [9, 9],
  });

const MapViewport: React.FC<{ opportunities: Opportunity[] }> = ({ opportunities }) => {
  const map = useMap();

  useEffect(() => {
    const coordinates = opportunities
      .filter((item): item is Opportunity & { latitude: number; longitude: number } =>
        typeof item.latitude === 'number' && typeof item.longitude === 'number',
      )
      .map((item) => [item.latitude, item.longitude] as [number, number]);

    if (coordinates.length === 0) {
      map.setView(defaultCenter, 4);
      return;
    }

    if (coordinates.length === 1) {
      map.setView(coordinates[0], 11);
      return;
    }

    map.fitBounds(L.latLngBounds(coordinates), {
      padding: [44, 44],
    });
  }, [map, opportunities]);

  return null;
};

const HomeView: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [workFormat, setWorkFormat] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>(getFavoriteOpportunityIds());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOpportunities = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await opportunityService.getAll();
        setOpportunities(data);
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Не удалось загрузить карьерные возможности.'));
      } finally {
        setLoading(false);
      }
    };

    loadOpportunities();
  }, []);

  useEffect(() => {
    const handleFavoritesUpdate = () => {
      setFavoriteIds(getFavoriteOpportunityIds());
    };

    window.addEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesUpdate);
    return () => window.removeEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesUpdate);
  }, []);

  const cities = useMemo(
    () =>
      Array.from(new Set(opportunities.map((item) => item.city).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'ru-RU'),
      ),
    [opportunities],
  );

  const featuredTags = useMemo(() => {
    const counts = new Map<string, number>();

    opportunities.forEach((item) => {
      splitTags(item.tags).forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [opportunities]);

  const filteredOpportunities = useMemo(
    () =>
      opportunities.filter((item) => {
        const matchesSearch =
          !search ||
          [item.title, item.shortDescription, item.companyName, item.tags]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(search.toLowerCase()));

        const matchesCity = !city || item.city === city;
        const matchesType = !type || item.type === type;
        const matchesFormat = !workFormat || item.workFormat === workFormat;
        const matchesTag = !selectedTag || splitTags(item.tags).includes(selectedTag);

        return matchesSearch && matchesCity && matchesType && matchesFormat && matchesTag;
      }),
    [city, opportunities, search, selectedTag, type, workFormat],
  );

  const mappableOpportunities = filteredOpportunities.filter(
    (item) => typeof item.latitude === 'number' && typeof item.longitude === 'number',
  );

  const summary = useMemo(
    () => ({
      total: opportunities.length,
      cities: cities.length,
      verified: opportunities.filter((item) => item.employer?.isVerified).length,
      favorites: favoriteIds.length,
    }),
    [cities.length, favoriteIds.length, opportunities],
  );

  const resetFilters = () => {
    setSearch('');
    setCity('');
    setType('');
    setWorkFormat('');
    setSelectedTag('');
  };

  const handleToggleFavorite = (opportunityId: string) => {
    setFavoriteIds(toggleFavoriteOpportunity(opportunityId));
  };

  const previewItems = viewMode === 'map' ? filteredOpportunities.slice(0, 6) : filteredOpportunities;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 }, pb: 8 }}>
      <Stack spacing={4}>
        <Paper
          sx={{
            overflow: 'hidden',
            borderRadius: 8,
            px: { xs: 3, md: 5 },
            py: { xs: 3.5, md: 5 },
            position: 'relative',
            background: `
              radial-gradient(circle at top right, rgba(45, 212, 191, 0.18), transparent 28%),
              radial-gradient(circle at bottom left, rgba(249, 115, 22, 0.14), transparent 24%),
              rgba(255, 252, 247, 0.82)
            `,
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gap: 4,
              alignItems: 'center',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.15fr) minmax(360px, 0.85fr)' },
            }}
          >
            <Stack spacing={2.5}>
              <Chip
                label="Новая платформа карьерного старта"
                color="secondary"
                sx={{
                  alignSelf: 'flex-start',
                  backgroundColor: 'rgba(249, 115, 22, 0.12)',
                  color: 'secondary.main',
                }}
              />
              <Typography variant="h1">
                Трамплин для первой сильной карьеры в IT.
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 720 }}>
                Вакансии, стажировки, менторские программы и карьерные события в одном пространстве,
                где студенты и выпускники могут не просто откликаться, а собирать свой профессиональный
                маршрут шаг за шагом.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  color="primary"
                  endIcon={<ArrowForwardRoundedIcon />}
                >
                  Начать карьерный путь
                </Button>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                >
                  Войти в экосистему
                </Button>
              </Stack>
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
                }}
              >
                {[
                  { label: 'Возможностей', value: summary.total },
                  { label: 'Городов на карте', value: summary.cities },
                  { label: 'Проверенных компаний', value: summary.verified },
                  { label: 'Сохранено в браузере', value: summary.favorites },
                ].map((item) => (
                  <Paper
                    key={item.label}
                    sx={{
                      borderRadius: 5,
                      p: 2,
                      backgroundColor: 'rgba(255,255,255,0.64)',
                    }}
                  >
                    <Typography variant="h4">{item.value}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Stack>

            <Box sx={{ position: 'relative', minHeight: { xs: 320, md: 420 } }}>
              <Box
                sx={{
                  position: 'absolute',
                  inset: { xs: 24, md: 36 },
                  borderRadius: 8,
                  background:
                    'linear-gradient(160deg, rgba(19, 34, 56, 0.96) 0%, rgba(15, 118, 110, 0.92) 100%)',
                  boxShadow: '0 40px 80px rgba(19, 34, 56, 0.26)',
                }}
              />
              <Box
                component="img"
                src={heroImage}
                alt="Иллюстрация платформы Трамплин"
                sx={{
                  position: 'absolute',
                  inset: { xs: 36, md: 54 },
                  width: 'calc(100% - 72px)',
                  maxWidth: 360,
                  margin: '0 auto',
                  objectFit: 'contain',
                }}
              />
              <Paper
                sx={{
                  position: 'absolute',
                  right: { xs: 12, md: 18 },
                  top: { xs: 18, md: 28 },
                  p: 2,
                  borderRadius: 5,
                  width: 220,
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <WorkspacePremiumRoundedIcon color="secondary" />
                  <Box>
                    <Typography variant="subtitle2">Проверенные компании</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Меньше шума, больше реальных возможностей.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
              <Paper
                sx={{
                  position: 'absolute',
                  left: { xs: 12, md: 18 },
                  bottom: { xs: 18, md: 24 },
                  p: 2,
                  borderRadius: 5,
                  width: 230,
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <HubRoundedIcon color="primary" />
                  <Box>
                    <Typography variant="subtitle2">Нетворкинг + вакансии</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Менторы, события и отклики внутри одной экосистемы.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 7 }}>
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', lg: 'center' }}
            >
              <Box>
                <Typography variant="h4">Живая лента карьерных возможностей</Typography>
                <Typography color="text.secondary">
                  Фильтруйте по формату, городу, типу и популярным технологиям.
                </Typography>
              </Box>
              <ToggleButtonGroup
                exclusive
                value={viewMode}
                onChange={(_event, nextValue: ViewMode | null) => {
                  if (nextValue) {
                    setViewMode(nextValue);
                  }
                }}
                size="small"
              >
                <ToggleButton value="map">
                  <MapRoundedIcon sx={{ mr: 1 }} />
                  Карта
                </ToggleButton>
                <ToggleButton value="list">
                  <ViewListRoundedIcon sx={{ mr: 1 }} />
                  Лента
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(5, minmax(0, 1fr))' },
              }}
            >
              <TextField
                label="Поиск по названию, компании или тегу"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                InputProps={{
                  startAdornment: <SearchRoundedIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              <TextField select label="Город" value={city} onChange={(event) => setCity(event.target.value)}>
                <MenuItem value="">Все города</MenuItem>
                {cities.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
              <TextField select label="Тип" value={type} onChange={(event) => setType(event.target.value)}>
                <MenuItem value="">Все типы</MenuItem>
                <MenuItem value="Vacancy">Вакансия</MenuItem>
                <MenuItem value="Internship">Стажировка</MenuItem>
                <MenuItem value="Mentorship">Менторская программа</MenuItem>
                <MenuItem value="Event">Карьерное событие</MenuItem>
              </TextField>
              <TextField
                select
                label="Формат"
                value={workFormat}
                onChange={(event) => setWorkFormat(event.target.value)}
              >
                <MenuItem value="">Любой формат</MenuItem>
                <MenuItem value="Office">Офис</MenuItem>
                <MenuItem value="Hybrid">Гибрид</MenuItem>
                <MenuItem value="Remote">Удалённо</MenuItem>
              </TextField>
              <Button variant="outlined" onClick={resetFilters}>
                Сбросить фильтры
              </Button>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {featuredTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onClick={() => setSelectedTag((current) => (current === tag ? '' : tag))}
                  color={selectedTag === tag ? 'primary' : 'default'}
                  variant={selectedTag === tag ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </Paper>

        {loading ? (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', lg: '1.2fr 0.8fr' },
            }}
          >
            <Skeleton variant="rounded" height={620} />
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={190} />
              <Skeleton variant="rounded" height={190} />
              <Skeleton variant="rounded" height={190} />
            </Stack>
          </Box>
        ) : filteredOpportunities.length === 0 ? (
          <Paper sx={{ p: 5, borderRadius: 7, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              Пока ничего не найдено
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Попробуйте убрать часть фильтров или посмотреть другие города и теги.
            </Typography>
            <Button variant="contained" onClick={resetFilters}>
              Показать все возможности
            </Button>
          </Paper>
        ) : viewMode === 'map' ? (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', xl: '1.25fr 0.75fr' },
              alignItems: 'start',
            }}
          >
            <Paper sx={{ height: { xs: 460, lg: 640 }, p: 1.25, borderRadius: 7 }}>
              <MapContainer center={defaultCenter} zoom={5} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapViewport opportunities={mappableOpportunities} />
                {mappableOpportunities.map((item) => {
                  const isFavorite = favoriteIds.includes(item.id);

                  return (
                    <Marker
                      key={item.id}
                      position={[item.latitude!, item.longitude!]}
                      icon={buildMarkerIcon(item, isFavorite)}
                    >
                      <Popup>
                        <Box className="popup-card">
                          <Typography variant="subtitle1" sx={{ mb: 0.75 }}>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.companyName}
                          </Typography>
                          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ my: 1 }}>
                            <Chip size="small" label={formatOpportunityType(item.type)} />
                            <Chip size="small" label={formatWorkFormat(item.workFormat)} variant="outlined" />
                          </Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                            {formatSalary(item.salaryFrom, item.salaryTo)}
                          </Typography>
                          <Button component={RouterLink} to={`/opportunity/${item.id}`} size="small" variant="contained">
                            Открыть карточку
                          </Button>
                        </Box>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </Paper>

            <Stack spacing={2}>
              {previewItems.map((item) => (
                <OpportunityCard
                  key={item.id}
                  opportunity={item}
                  compact
                  isFavorite={favoriteIds.includes(item.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </Stack>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
            }}
          >
            {previewItems.map((item) => (
              <OpportunityCard
                key={item.id}
                opportunity={item}
                isFavorite={favoriteIds.includes(item.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </Box>
        )}

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          }}
        >
          {[
            {
              icon: <HandshakeRoundedIcon color="primary" />,
              title: 'Маршрут от стажировки до оффера',
              text: 'В одной экосистеме видны вакансии, стажировки, события и точки входа в профессии.',
            },
            {
              icon: <LocationCityRoundedIcon color="secondary" />,
              title: 'Карта офлайн- и онлайн-возможностей',
              text: 'Можно быстро увидеть, где проходят события и какие компании активно нанимают по городам.',
            },
            {
              icon: <BookmarkAddedRoundedIcon color="primary" />,
              title: 'Избранное сохраняется в браузере',
              text: 'Даже без авторизации можно собрать личную подборку карточек и вернуться к ней позже.',
            },
          ].map((item) => (
            <Paper key={item.title} sx={{ p: 3, borderRadius: 6 }}>
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 3,
                    display: 'grid',
                    placeItems: 'center',
                    backgroundColor: alpha('#ffffff', 0.72),
                  }}
                >
                  {item.icon}
                </Box>
                <Typography variant="h6">{item.title}</Typography>
                <Typography color="text.secondary">{item.text}</Typography>
              </Stack>
            </Paper>
          ))}
        </Box>

        <Paper
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 7,
            display: 'grid',
            gap: 2,
            alignItems: 'center',
            gridTemplateColumns: { xs: '1fr', lg: '1fr auto' },
          }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Для работодателей, вузов и карьерных центров
            </Typography>
            <Typography color="text.secondary">
              Публикуйте стажировки, менторские программы и карьерные мероприятия в современном каталоге,
              который одинаково удобно смотрится и на карте, и в виде ленты.
            </Typography>
          </Box>
          <Button
            component={RouterLink}
            to="/register"
            variant="contained"
            color="secondary"
            endIcon={<CalendarMonthRoundedIcon />}
          >
            Подключить компанию
          </Button>
        </Paper>
      </Stack>
    </Container>
  );
};

export default HomeView;
