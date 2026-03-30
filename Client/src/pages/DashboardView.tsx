import React, { useEffect, useMemo, useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import Diversity3RoundedIcon from '@mui/icons-material/Diversity3Rounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import OpportunityCard from '../components/OpportunityCard';
import { useAuth } from '../components/AuthContext';
import { applicationService, opportunityService, profileService } from '../services/api';
import type { ApplicantProfile, Application, ApplicationStatus, EmployerProfile, Opportunity } from '../types';
import { getErrorMessage, getErrorStatus } from '../utils/http';
import {
  formatApplicationStatus,
  formatDate,
  formatOpportunityStatus,
  splitTags,
} from '../utils/opportunity';

const getStatusChipColor = (status: ApplicationStatus) => {
  switch (status) {
    case 'Accepted':
      return 'success';
    case 'Rejected':
      return 'error';
    case 'Reserved':
      return 'info';
    case 'Pending':
    default:
      return 'warning';
  }
};

const extractMessage = (error: unknown) => getErrorMessage(error, 'Не удалось загрузить данные кабинета.');
const isNotFound = (error: unknown) => getErrorStatus(error) === 404;

const DashboardView: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [applications, setApplications] = useState<Application[]>([]);
  const [incomingApplications, setIncomingApplications] = useState<Application[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [profile, setProfile] = useState<ApplicantProfile | EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdatingId, setStatusUpdatingId] = useState('');

  const roles = user?.roles ?? [];
  const isApplicant = roles.includes('Applicant');
  const isEmployer = roles.includes('Employer');
  const isCurator = roles.includes('Curator') || roles.includes('Admin');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        if (isApplicant) {
          const [appsResult, profileResult] = await Promise.allSettled([
            applicationService.getMy(),
            profileService.getApplicantProfile(),
          ]);

          if (appsResult.status === 'fulfilled') {
            setApplications(appsResult.value);
          } else {
            throw appsResult.reason;
          }

          if (profileResult.status === 'fulfilled') {
            setProfile(profileResult.value);
          } else if (!isNotFound(profileResult.reason)) {
            throw profileResult.reason;
          }
        }

        if (isEmployer) {
          const [profileResult, opportunitiesResult, applicationsResult] = await Promise.allSettled([
            profileService.getEmployerProfile(),
            opportunityService.getMy(),
            applicationService.getForMyOpportunities(),
          ]);

          if (profileResult.status === 'fulfilled') {
            setProfile(profileResult.value);
          } else if (!isNotFound(profileResult.reason)) {
            throw profileResult.reason;
          }

          if (opportunitiesResult.status === 'fulfilled') {
            setOpportunities(opportunitiesResult.value);
          } else {
            throw opportunitiesResult.reason;
          }

          if (applicationsResult.status === 'fulfilled') {
            setIncomingApplications(applicationsResult.value);
          } else {
            throw applicationsResult.reason;
          }
        }
      } catch (loadError) {
        setError(extractMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isApplicant, isAuthenticated, isEmployer, navigate]);

  const applicantMetrics = useMemo(
    () => ({
      total: applications.length,
      active: applications.filter((item) => item.status === 'Pending' || item.status === 'Reserved').length,
      accepted: applications.filter((item) => item.status === 'Accepted').length,
    }),
    [applications],
  );

  const employerMetrics = useMemo(
    () => ({
      total: opportunities.length,
      active: opportunities.filter((item) => item.status === 'Active').length,
      candidates: incomingApplications.length,
    }),
    [incomingApplications.length, opportunities],
  );

  const handleStatusChange = async (applicationId: string, nextStatus: ApplicationStatus) => {
    setStatusUpdatingId(applicationId);

    try {
      await applicationService.updateStatus(applicationId, nextStatus);
      setIncomingApplications((current) =>
        current.map((item) => (item.id === applicationId ? { ...item, status: nextStatus } : item)),
      );
    } catch (updateError) {
      setError(extractMessage(updateError));
    } finally {
      setStatusUpdatingId('');
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper sx={{ p: 6, borderRadius: 7, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }} color="text.secondary">
            Загружаем ваш кабинет...
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 }, pb: 8 }}>
      <Stack spacing={3}>
        <Paper
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 8,
            display: 'grid',
            gap: 2,
            alignItems: 'center',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) auto' },
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 64,
                height: 64,
                fontSize: 28,
                fontWeight: 800,
                background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 100%)',
              }}
            >
              {user.displayName.slice(0, 1).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h3" gutterBottom>
                {user.displayName}
              </Typography>
              <Typography color="text.secondary">
                {isEmployer
                  ? 'Кабинет работодателя'
                  : isApplicant
                    ? 'Кабинет соискателя'
                    : 'Кабинет куратора платформы'}
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
            {isEmployer && (
              <Button
                component={RouterLink}
                to="/create-opportunity"
                variant="contained"
                startIcon={<AddRoundedIcon />}
              >
                Новая возможность
              </Button>
            )}
            <Button variant="outlined" onClick={logout}>
              Выйти
            </Button>
          </Stack>
        </Paper>

        {error && <Alert severity="error">{error}</Alert>}

        {isApplicant && (
          <>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
              }}
            >
              {[
                { title: 'Всего откликов', value: applicantMetrics.total, icon: <WorkRoundedIcon color="primary" /> },
                { title: 'В процессе', value: applicantMetrics.active, icon: <RocketLaunchRoundedIcon color="secondary" /> },
                { title: 'Принято', value: applicantMetrics.accepted, icon: <VerifiedRoundedIcon color="success" /> },
              ].map((item) => (
                <Paper key={item.title} sx={{ p: 3, borderRadius: 6 }}>
                  <Stack spacing={1.5}>
                    {item.icon}
                    <Typography variant="h4">{item.value}</Typography>
                    <Typography color="text.secondary">{item.title}</Typography>
                  </Stack>
                </Paper>
              ))}
            </Box>

            <Paper sx={{ borderRadius: 7, p: { xs: 2, md: 3 } }}>
              <Tabs value={tabValue} onChange={(_event, value) => setTabValue(value)}>
                <Tab label="Мои отклики" />
                <Tab label="Профиль" />
              </Tabs>

              {tabValue === 0 && (
                <Stack spacing={2.5} sx={{ mt: 3 }}>
                  {applications.length === 0 ? (
                    <Paper sx={{ p: 4, borderRadius: 6, textAlign: 'center' }}>
                      <Typography variant="h5" gutterBottom>
                        Откликов пока нет
                      </Typography>
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Исследуйте карту и ленту возможностей, чтобы начать карьерный трек.
                      </Typography>
                      <Button component={RouterLink} to="/" variant="contained">
                        Открыть каталог
                      </Button>
                    </Paper>
                  ) : (
                    applications.map((item) => (
                      <Paper key={item.id} sx={{ p: 3, borderRadius: 6 }}>
                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          spacing={2}
                          justifyContent="space-between"
                          alignItems={{ xs: 'flex-start', md: 'center' }}
                        >
                          <Box>
                            <Typography
                              variant="h6"
                              component={RouterLink}
                              to={`/opportunity/${item.opportunity.id}`}
                              sx={{ '&:hover': { color: 'primary.main' } }}
                            >
                              {item.opportunity.title}
                            </Typography>
                            <Typography color="text.secondary">
                              {item.opportunity.companyName} · отклик отправлен {formatDate(item.createdAt)}
                            </Typography>
                          </Box>
                          <Chip
                            label={formatApplicationStatus(item.status)}
                            color={getStatusChipColor(item.status)}
                          />
                        </Stack>
                      </Paper>
                    ))
                  )}
                </Stack>
              )}

              {tabValue === 1 && (
                <Box sx={{ mt: 3 }}>
                  {profile ? (
                    <Paper sx={{ p: 3, borderRadius: 6 }}>
                      <Stack spacing={2}>
                        <Typography variant="h5">{(profile as ApplicantProfile).fullName}</Typography>
                        <Typography color="text.secondary">
                          {(profile as ApplicantProfile).university} · {(profile as ApplicantProfile).faculty}
                        </Typography>
                        <Typography color="text.secondary">
                          {(profile as ApplicantProfile).courseOrGraduationYear}
                          {(profile as ApplicantProfile).city ? ` · ${(profile as ApplicantProfile).city}` : ''}
                        </Typography>
                        <Typography>{(profile as ApplicantProfile).about}</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {splitTags((profile as ApplicantProfile).skills).map((skill) => (
                            <Chip key={skill} label={skill} />
                          ))}
                        </Stack>
                      </Stack>
                    </Paper>
                  ) : (
                    <Paper sx={{ p: 4, borderRadius: 6 }}>
                      <Typography variant="h5" gutterBottom>
                        Профиль пока не заполнен
                      </Typography>
                      <Typography color="text.secondary">
                        Бэкенд уже поддерживает профиль соискателя. На следующем шаге можно добавить отдельную
                        форму редактирования прямо в кабинете.
                      </Typography>
                    </Paper>
                  )}
                </Box>
              )}
            </Paper>
          </>
        )}

        {isEmployer && (
          <>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
              }}
            >
              {[
                { title: 'Все публикации', value: employerMetrics.total, icon: <ApartmentRoundedIcon color="primary" /> },
                { title: 'Активные карточки', value: employerMetrics.active, icon: <InsightsRoundedIcon color="secondary" /> },
                { title: 'Входящие кандидаты', value: employerMetrics.candidates, icon: <Diversity3RoundedIcon color="primary" /> },
              ].map((item) => (
                <Paper key={item.title} sx={{ p: 3, borderRadius: 6 }}>
                  <Stack spacing={1.5}>
                    {item.icon}
                    <Typography variant="h4">{item.value}</Typography>
                    <Typography color="text.secondary">{item.title}</Typography>
                  </Stack>
                </Paper>
              ))}
            </Box>

            <Paper sx={{ borderRadius: 7, p: { xs: 2, md: 3 } }}>
              <Tabs value={tabValue} onChange={(_event, value) => setTabValue(value)}>
                <Tab label="Мои возможности" />
                <Tab label="Кандидаты" />
                <Tab label="Профиль компании" />
              </Tabs>

              {tabValue === 0 && (
                <Stack spacing={2.5} sx={{ mt: 3 }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                    <Box>
                      <Typography variant="h5">Лента публикаций</Typography>
                      <Typography color="text.secondary">
                        Следите за статусами карточек и быстро переходите к их просмотру.
                      </Typography>
                    </Box>
                    <Button component={RouterLink} to="/create-opportunity" variant="contained" startIcon={<AddRoundedIcon />}>
                      Создать новую карточку
                    </Button>
                  </Stack>

                  {opportunities.length === 0 ? (
                    <Paper sx={{ p: 4, borderRadius: 6, textAlign: 'center' }}>
                      <Typography variant="h5" gutterBottom>
                        Пока нет ни одной публикации
                      </Typography>
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Создайте первую вакансию, стажировку или карьерное событие.
                      </Typography>
                      <Button component={RouterLink} to="/create-opportunity" variant="contained">
                        Создать карточку
                      </Button>
                    </Paper>
                  ) : (
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' },
                      }}
                    >
                      {opportunities.map((item) => (
                        <Box key={item.id}>
                          <OpportunityCard opportunity={item} />
                          <Chip
                            label={formatOpportunityStatus(item.status)}
                            sx={{ mt: 1.25, ml: 0.5 }}
                            color={item.status === 'Active' ? 'success' : 'default'}
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Stack>
              )}

              {tabValue === 1 && (
                <Stack spacing={2} sx={{ mt: 3 }}>
                  {incomingApplications.length === 0 ? (
                    <Paper sx={{ p: 4, borderRadius: 6, textAlign: 'center' }}>
                      <Typography variant="h5" gutterBottom>
                        Кандидаты ещё не откликались
                      </Typography>
                      <Typography color="text.secondary">
                        Как только появятся отклики, они будут собраны здесь по вашим публикациям.
                      </Typography>
                    </Paper>
                  ) : (
                    incomingApplications.map((item) => (
                      <Paper key={item.id} sx={{ p: 3, borderRadius: 6 }}>
                        <Stack
                          direction={{ xs: 'column', lg: 'row' }}
                          spacing={2}
                          justifyContent="space-between"
                          alignItems={{ xs: 'flex-start', lg: 'center' }}
                        >
                          <Box>
                            <Typography variant="h6">
                              {item.applicant?.fullName ?? 'Кандидат'}
                            </Typography>
                            <Typography color="text.secondary">
                              {item.applicant?.university ?? 'Профиль вуза не заполнен'}
                              {item.applicant?.courseOrGraduationYear ? ` · ${item.applicant.courseOrGraduationYear}` : ''}
                            </Typography>
                            <Typography sx={{ mt: 1 }}>
                              Отклик на: {item.opportunity.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Получено {formatDate(item.createdAt)}
                            </Typography>
                          </Box>

                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems="center">
                            <TextField
                              select
                              label="Статус"
                              size="small"
                              value={item.status}
                              onChange={(event) =>
                                handleStatusChange(item.id, event.target.value as ApplicationStatus)
                              }
                              disabled={statusUpdatingId === item.id}
                              sx={{ minWidth: 220 }}
                            >
                              {([
                                ['Pending', 'На рассмотрении'],
                                ['Reserved', 'В резерве'],
                                ['Accepted', 'Принят'],
                                ['Rejected', 'Отклонён'],
                              ] as Array<[ApplicationStatus, string]>).map(([value, label]) => (
                                <MenuItem key={value} value={value}>
                                  {label}
                                </MenuItem>
                              ))}
                            </TextField>
                            <Chip
                              label={formatApplicationStatus(item.status)}
                              color={getStatusChipColor(item.status)}
                            />
                          </Stack>
                        </Stack>
                      </Paper>
                    ))
                  )}
                </Stack>
              )}

              {tabValue === 2 && (
                <Box sx={{ mt: 3 }}>
                  {profile ? (
                    <Paper sx={{ p: 3, borderRadius: 6 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Typography variant="h5">{(profile as EmployerProfile).companyName}</Typography>
                          {(profile as EmployerProfile).isVerified && (
                            <Chip label="Верифицировано" color="success" icon={<VerifiedRoundedIcon />} />
                          )}
                        </Stack>
                        <Typography color="text.secondary">
                          {(profile as EmployerProfile).industry}
                          {(profile as EmployerProfile).city ? ` · ${(profile as EmployerProfile).city}` : ''}
                        </Typography>
                        <Typography>{(profile as EmployerProfile).description}</Typography>
                      </Stack>
                    </Paper>
                  ) : (
                    <Paper sx={{ p: 4, borderRadius: 6 }}>
                      <Typography variant="h5" gutterBottom>
                        Профиль компании пока не создан
                      </Typography>
                      <Typography color="text.secondary">
                        Бэкенд уже поддерживает профиль работодателя. Следующим шагом можно добавить форму
                        редактирования и блок верификации прямо в кабинет.
                      </Typography>
                    </Paper>
                  )}
                </Box>
              )}
            </Paper>
          </>
        )}

        {isCurator && !isApplicant && !isEmployer && (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            }}
          >
            {[
              {
                icon: <VerifiedRoundedIcon color="primary" />,
                title: 'Верификация работодателей',
                text: 'Проверка компании, домена почты и подтверждающих данных перед публикацией.',
              },
              {
                icon: <InsightsRoundedIcon color="secondary" />,
                title: 'Модерация карточек',
                text: 'Управление статусом карточек и контроль качества контента на платформе.',
              },
              {
                icon: <SchoolRoundedIcon color="primary" />,
                title: 'Работа с вузами',
                text: 'Кураторский контур для координации карьерных центров и партнёров платформы.',
              },
            ].map((item) => (
              <Paper key={item.title} sx={{ p: 3, borderRadius: 6 }}>
                <Stack spacing={1.5}>
                  {item.icon}
                  <Typography variant="h6">{item.title}</Typography>
                  <Typography color="text.secondary">{item.text}</Typography>
                </Stack>
              </Paper>
            ))}
          </Box>
        )}
      </Stack>
    </Container>
  );
};

export default DashboardView;
