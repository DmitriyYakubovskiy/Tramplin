import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import { Alert, Button, Chip, Container, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { applicationService } from '../services/api';
import type { Application } from '../types';
import { getErrorMessage } from '../utils/http';
import { applicationStatusLabel, formatDate, getApplicationColor, opportunityStatusLabel } from '../utils/presentation';

const ApplicantApplicationsScreen = () => {
  const { isAuthenticated, user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
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
        const data = await applicationService.getMy();
        setApplications(data);
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Не удалось загрузить историю откликов.'));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [isApplicant, isAuthenticated]);

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
            <RocketLaunchRoundedIcon color="secondary" />
            <BoxText
              title="История откликов"
              description="Здесь собраны все отклики соискателя по вакансиям, стажировкам и другим возможностям."
            />
          </Stack>
        </Paper>

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Paper sx={{ p: 4, borderRadius: 7 }}>
            <Typography color="text.secondary">Загружаем историю откликов...</Typography>
          </Paper>
        ) : applications.length > 0 ? (
          <Stack spacing={1.5}>
            {applications.map((application) => (
              <Paper key={application.id} sx={{ p: 3, borderRadius: 6 }}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      size="small"
                      label={applicationStatusLabel[application.status]}
                      color={getApplicationColor(application.status)}
                    />
                    {application.opportunity && (
                      <Chip
                        size="small"
                        label={opportunityStatusLabel[application.opportunity.status]}
                        variant="outlined"
                      />
                    )}
                  </Stack>
                  <Typography variant="h6">{application.opportunity?.title ?? 'Возможность удалена'}</Typography>
                  <Typography color="text.secondary">
                    {application.opportunity?.companyName} {application.opportunity?.city ? `· ${application.opportunity.city}` : ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Отклик от {formatDate(application.createdAt)}
                  </Typography>
                  {application.opportunity && (
                    <Button component={RouterLink} to={`/opportunity/${application.opportunity.id}`} variant="text" sx={{ px: 0, mt: 0.5 }}>
                      Открыть возможность
                    </Button>
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Paper sx={{ p: 4, borderRadius: 7, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Откликов пока нет
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Исследуйте каталог возможностей и начните карьерный трек с первого отклика.
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

const BoxText = ({ title, description }: { title: string; description: string }) => (
  <Stack spacing={0.5}>
    <Typography variant="h4">{title}</Typography>
    <Typography color="text.secondary">{description}</Typography>
  </Stack>
);

export default ApplicantApplicationsScreen;
