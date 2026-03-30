import BookmarkRoundedIcon from '@mui/icons-material/BookmarkRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Chip, Container, Divider, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { favoritesService } from '../services/api';
import type { Favorite } from '../types';
import { getErrorMessage } from '../utils/http';

const ApplicantFavoritesScreen = () => {
  const { isAuthenticated, user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isApplicant = user?.roles.includes('Applicant');

  useEffect(() => {
    if (!isAuthenticated || !isApplicant) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await favoritesService.getMy();
        setFavorites(data);
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Не удалось загрузить избранное.'));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [isApplicant, isAuthenticated]);

  const favoriteOpportunities = useMemo(
    () => favorites.filter((item) => item.type === 'Opportunity' && item.opportunity),
    [favorites],
  );
  const favoriteEmployers = useMemo(
    () => favorites.filter((item) => item.type === 'Employer' && item.employer),
    [favorites],
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isApplicant) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2.5, md: 4 }, pb: { xs: 5, md: 8 } }}>
      <Stack spacing={3}>
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 7 }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <BookmarkRoundedIcon color="secondary" />
            <Stack spacing={0.5}>
              <Typography variant="h4">Избранное</Typography>
              <Typography color="text.secondary">
                Здесь собраны сохранённые возможности и компании, к которым соискатель хочет вернуться позже.
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Paper sx={{ p: 4, borderRadius: 7 }}>
            <Typography color="text.secondary">Загружаем избранное...</Typography>
          </Paper>
        ) : favoriteOpportunities.length > 0 || favoriteEmployers.length > 0 ? (
          <Stack spacing={3}>
            <Paper sx={{ p: 3, borderRadius: 6 }}>
              <Stack spacing={1.5}>
                <Typography variant="h6">Сохранённые возможности</Typography>
                {favoriteOpportunities.length > 0 ? (
                  favoriteOpportunities.map((item) => (
                    <Paper key={item.id} sx={{ p: 2, borderRadius: 4 }}>
                      <Typography variant="subtitle1">{item.opportunity?.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.opportunity?.companyName} {item.opportunity?.city ? `· ${item.opportunity.city}` : ''}
                      </Typography>
                      {item.opportunity && (
                        <Button component={RouterLink} to={`/opportunity/${item.opportunity.id}`} variant="text" sx={{ px: 0, mt: 1 }}>
                          Открыть карточку
                        </Button>
                      )}
                    </Paper>
                  ))
                ) : (
                  <Typography color="text.secondary">Сохранённых возможностей пока нет.</Typography>
                )}
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 6 }}>
              <Stack spacing={1.5}>
                <Typography variant="h6">Компании в избранном</Typography>
                {favoriteEmployers.length > 0 ? (
                  <>
                    <Divider />
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {favoriteEmployers.map((item) => (
                        <Chip
                          key={item.id}
                          icon={item.employer?.isVerified ? <VerifiedRoundedIcon /> : undefined}
                          label={item.employer?.companyName ?? 'Компания'}
                        />
                      ))}
                    </Stack>
                  </>
                ) : (
                  <Typography color="text.secondary">Компаний в избранном пока нет.</Typography>
                )}
              </Stack>
            </Paper>
          </Stack>
        ) : (
          <Paper sx={{ p: 4, borderRadius: 7, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Избранное пока пусто
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Сохраняйте интересные вакансии, стажировки и компании, чтобы быстро вернуться к ним позже.
            </Typography>
            <Button component={RouterLink} to="/" variant="contained">
              Открыть возможности
            </Button>
          </Paper>
        )}
      </Stack>
    </Container>
  );
};

export default ApplicantFavoritesScreen;
