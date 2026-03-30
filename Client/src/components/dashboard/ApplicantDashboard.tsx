import { useEffect, useMemo, useState } from 'react';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import TipsAndUpdatesRoundedIcon from '@mui/icons-material/TipsAndUpdatesRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  applicationService,
  contactsService,
  profileService,
  recommendationsService,
} from '../../services/api';
import type {
  ApplicantProfile,
  Application,
  Contact,
  ContactStatus,
  Recommendation,
} from '../../types';
import { getErrorMessage, getErrorStatus } from '../../utils/http';

interface ApplicantFormState {
  fullName: string;
  university: string;
  faculty: string;
  courseOrGraduationYear: string;
  about: string;
  careerInterests: string;
  skills: string;
  projectExperience: string;
  portfolioUrl: string;
  gitHubUrl: string;
  resumeFileUrl: string;
  city: string;
  isOpenToWork: boolean;
  isProfilePublic: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showContactsOnlyForVerifiedEmployers: boolean;
  showResumeToAuthenticatedUsers: boolean;
  showApplicationsToApplicants: boolean;
}

const defaultForm: ApplicantFormState = {
  fullName: '',
  university: '',
  faculty: '',
  courseOrGraduationYear: '',
  about: '',
  careerInterests: '',
  skills: '',
  projectExperience: '',
  portfolioUrl: '',
  gitHubUrl: '',
  resumeFileUrl: '',
  city: '',
  isOpenToWork: true,
  isProfilePublic: false,
  showEmail: false,
  showPhone: false,
  showContactsOnlyForVerifiedEmployers: true,
  showResumeToAuthenticatedUsers: false,
  showApplicationsToApplicants: false,
};

const mapProfileToForm = (profile: ApplicantProfile | null): ApplicantFormState => {
  if (!profile) {
    return defaultForm;
  }

  return {
    fullName: profile.fullName,
    university: profile.university,
    faculty: profile.faculty,
    courseOrGraduationYear: profile.courseOrGraduationYear,
    about: profile.about,
    careerInterests: profile.careerInterests,
    skills: profile.skills,
    projectExperience: profile.projectExperience,
    portfolioUrl: profile.portfolioUrl ?? '',
    gitHubUrl: profile.gitHubUrl ?? '',
    resumeFileUrl: profile.resumeFileUrl ?? '',
    city: profile.city,
    isOpenToWork: profile.isOpenToWork,
    isProfilePublic: profile.isProfilePublic,
    showEmail: Boolean(profile.showEmail),
    showPhone: Boolean(profile.showPhone),
    showContactsOnlyForVerifiedEmployers: profile.showContactsOnlyForVerifiedEmployers ?? true,
    showResumeToAuthenticatedUsers: Boolean(profile.showResumeToAuthenticatedUsers),
    showApplicationsToApplicants: Boolean(profile.showApplicationsToApplicants),
  };
};

const ApplicantDashboard = () => {
  const [profile, setProfile] = useState<ApplicantProfile | null>(null);
  const [form, setForm] = useState<ApplicantFormState>(defaultForm);
  const [applications, setApplications] = useState<Application[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [directory, setDirectory] = useState<ApplicantProfile[]>([]);
  const [directorySearch, setDirectorySearch] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      const loadMyProfile = async () => {
        try {
          return await profileService.getApplicantProfile();
        } catch (loadError) {
          if (getErrorStatus(loadError) === 404) {
            return null;
          }

          throw loadError;
        }
      };

      try {
        const [profileData, applicationsData, contactsData, recommendationsData, directoryData] =
          await Promise.all([
            loadMyProfile(),
            applicationService.getMy().catch(() => [] as Application[]),
            contactsService.getMy().catch(() => [] as Contact[]),
            recommendationsService.getMy().catch(() => [] as Recommendation[]),
            profileService.getApplicantDirectory().catch(() => [] as ApplicantProfile[]),
          ]);

        setProfile(profileData);
        setForm(mapProfileToForm(profileData));
        setApplications(applicationsData);
        setContacts(contactsData);
        setRecommendations(recommendationsData);
        setDirectory(directoryData);
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Не удалось загрузить кабинет соискателя.'));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const setField = <K extends keyof ApplicantFormState>(key: K, value: ApplicantFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const savedProfile = profile
        ? await profileService.updateApplicantProfile({ ...form })
        : await profileService.createApplicantProfile({ ...form });

      setProfile(savedProfile);
      setForm(mapProfileToForm(savedProfile));
      setSuccess(profile ? 'Профиль соискателя обновлен.' : 'Профиль соискателя создан.');
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Не удалось сохранить профиль соискателя.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateContact = async (peerId: string) => {
    setError('');
    setSuccess('');

    try {
      const created = await contactsService.create({
        receiverApplicantProfileId: peerId,
        message: contactMessage || undefined,
      });

      setContacts((current) => [created, ...current]);
      setContactMessage('');
      setSuccess('Запрос в профессиональные контакты отправлен.');
    } catch (contactError) {
      setError(getErrorMessage(contactError, 'Не удалось отправить запрос в контакты.'));
    }
  };

  const handleContactStatus = async (contactId: string, status: ContactStatus) => {
    setError('');
    setSuccess('');

    try {
      const updated = await contactsService.updateStatus(contactId, status);
      setContacts((current) => current.map((item) => (item.id === contactId ? updated : item)));
      setSuccess(status === 'Accepted' ? 'Контакт подтвержден.' : 'Статус запроса обновлен.');
    } catch (statusError) {
      setError(getErrorMessage(statusError, 'Не удалось обновить статус контакта.'));
    }
  };

  const incomingContacts = contacts.filter((item) => item.isIncoming && item.status === 'Pending');
  const acceptedContacts = contacts.filter((item) => item.status === 'Accepted');

  const connectedIds = useMemo(
    () => new Set(contacts.map((item) => item.peer?.id).filter((item): item is string => Boolean(item))),
    [contacts],
  );

  const availablePeople = useMemo(() => {
    const search = directorySearch.trim().toLowerCase();

    return directory
      .filter((item) => item.id !== profile?.id && !connectedIds.has(item.id))
      .filter((item) => {
        if (!search) {
          return true;
        }

        return [item.fullName, item.university, item.city, item.careerInterests]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search);
      })
      .slice(0, 8);
  }, [connectedIds, directory, directorySearch, profile?.id]);

  if (loading) {
    return (
      <Paper sx={{ p: 4, borderRadius: 6 }}>
        <Typography color="text.secondary">Загружаем кабинет соискателя...</Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 7 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} justifyContent="space-between">
          <Box>
            <Chip label="Соискатель" color="secondary" sx={{ mb: 1.5 }} />
            <Typography variant="h3" gutterBottom>
              Профиль, отклики и карьерный нетворкинг
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 760 }}>
              Здесь мы собираем резюме, управляем приватностью, сохраняем интересные возможности, строим контакты и
              отслеживаем рекомендации от других участников платформы.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1.25} sx={{ minWidth: { md: 240 } }}>
            <Paper sx={{ p: 2.25, borderRadius: 5 }}>
              <Typography variant="overline" color="text.secondary">
                Статус профиля
              </Typography>
              <Typography variant="h6">{profile ? 'Готов к работе' : 'Нужно заполнить анкету'}</Typography>
            </Paper>
            <Paper sx={{ p: 2.25, borderRadius: 5 }}>
              <Typography variant="overline" color="text.secondary">
                Отклики
              </Typography>
              <Typography variant="h6">{applications.length}</Typography>
            </Paper>
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
          gridTemplateColumns: '1fr',
        }}
      >
        <Paper component="form" onSubmit={handleProfileSubmit} sx={{ p: 3, borderRadius: 6 }}>
          <Stack spacing={2.5}>
            <Typography variant="h5">Резюме и приватность</Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
              <TextField label="ФИО" value={form.fullName} onChange={(event) => setField('fullName', event.target.value)} required />
              <TextField label="Город" value={form.city} onChange={(event) => setField('city', event.target.value)} required />
              <TextField label="Вуз" value={form.university} onChange={(event) => setField('university', event.target.value)} required />
              <TextField label="Факультет" value={form.faculty} onChange={(event) => setField('faculty', event.target.value)} required />
              <TextField
                label="Курс / год выпуска"
                value={form.courseOrGraduationYear}
                onChange={(event) => setField('courseOrGraduationYear', event.target.value)}
                required
              />
              <TextField label="Карьерные интересы" value={form.careerInterests} onChange={(event) => setField('careerInterests', event.target.value)} />
              <TextField label="GitHub" value={form.gitHubUrl} onChange={(event) => setField('gitHubUrl', event.target.value)} />
              <TextField label="Портфолио" value={form.portfolioUrl} onChange={(event) => setField('portfolioUrl', event.target.value)} />
              <TextField
                label="Ссылка на резюме"
                value={form.resumeFileUrl}
                onChange={(event) => setField('resumeFileUrl', event.target.value)}
              />
            </Box>
            <TextField label="О себе" value={form.about} onChange={(event) => setField('about', event.target.value)} multiline rows={4} />
            <TextField label="Навыки" value={form.skills} onChange={(event) => setField('skills', event.target.value)} multiline rows={3} />
            <TextField
              label="Проектный опыт"
              value={form.projectExperience}
              onChange={(event) => setField('projectExperience', event.target.value)}
              multiline
              rows={4}
            />

            <Divider />

            <Typography variant="h6">Настройки видимости</Typography>
            <Box sx={{ display: 'grid', gap: 1 }}>
              <FormControlLabel
                control={<Switch checked={form.isOpenToWork} onChange={(event) => setField('isOpenToWork', event.target.checked)} />}
                label="Показывать, что я открыт к стажировке или работе"
              />
              <FormControlLabel
                control={<Switch checked={form.isProfilePublic} onChange={(event) => setField('isProfilePublic', event.target.checked)} />}
                label="Открыть профиль всем авторизованным пользователям"
              />
              <FormControlLabel
                control={<Switch checked={form.showEmail} onChange={(event) => setField('showEmail', event.target.checked)} />}
                label="Показывать e-mail работодателям и контактам"
              />
              <FormControlLabel
                control={<Switch checked={form.showPhone} onChange={(event) => setField('showPhone', event.target.checked)} />}
                label="Показывать телефон в приватных сценариях"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.showContactsOnlyForVerifiedEmployers}
                    onChange={(event) => setField('showContactsOnlyForVerifiedEmployers', event.target.checked)}
                  />
                }
                label="Показывать контакты только верифицированным работодателям"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.showResumeToAuthenticatedUsers}
                    onChange={(event) => setField('showResumeToAuthenticatedUsers', event.target.checked)}
                  />
                }
                label="Разрешить просмотр резюме авторизованным пользователям"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.showApplicationsToApplicants}
                    onChange={(event) => setField('showApplicationsToApplicants', event.target.checked)}
                  />
                }
                label="Разрешить контактам видеть историю откликов"
              />
            </Box>

            <Button type="submit" variant="contained" size="large" disabled={saving} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              {saving ? 'Сохраняем...' : profile ? 'Обновить профиль' : 'Создать профиль'}
            </Button>
          </Stack>
        </Paper>

      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', xl: '0.95fr 1.05fr' },
        }}
      >
        <Paper sx={{ p: 3, borderRadius: 6 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
            <GroupsRoundedIcon color="secondary" />
            <Typography variant="h6">Профессиональные контакты</Typography>
          </Stack>

          <Stack spacing={2}>
            {incomingContacts.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Входящие запросы
                </Typography>
                <Stack spacing={1.25}>
                  {incomingContacts.map((item) => (
                    <Paper key={item.id} sx={{ p: 2, borderRadius: 4 }}>
                      <Typography variant="subtitle2">{item.peer?.fullName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.peer?.university} · {item.peer?.city}
                      </Typography>
                      {item.message && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {item.message}
                        </Typography>
                      )}
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
                        <Button variant="contained" onClick={() => handleContactStatus(item.id, 'Accepted')}>
                          Принять
                        </Button>
                        <Button variant="outlined" onClick={() => handleContactStatus(item.id, 'Rejected')}>
                          Отклонить
                        </Button>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Подтвержденные контакты
              </Typography>
              <Stack spacing={1.25}>
                {acceptedContacts.length > 0 ? (
                  acceptedContacts.map((item) => (
                    <Paper key={item.id} sx={{ p: 2, borderRadius: 4 }}>
                      <Typography variant="subtitle2">{item.peer?.fullName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.peer?.university} · {item.peer?.courseOrGraduationYear}
                      </Typography>
                      {item.peer?.careerInterests && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Интересы: {item.peer.careerInterests}
                        </Typography>
                      )}
                    </Paper>
                  ))
                ) : (
                  <Typography color="text.secondary">Контактов пока нет. Добавьте коллег по отрасли из каталога ниже.</Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        </Paper>

        <Stack spacing={3}>
          <Paper sx={{ p: 3, borderRadius: 6 }}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
              <PersonAddRoundedIcon color="secondary" />
              <Typography variant="h6">Нетворкинг</Typography>
            </Stack>
            <Stack spacing={2}>
              <TextField
                label="Поиск по каталогу соискателей"
                value={directorySearch}
                onChange={(event) => setDirectorySearch(event.target.value)}
              />
              <TextField
                label="Сообщение для запроса"
                value={contactMessage}
                onChange={(event) => setContactMessage(event.target.value)}
                multiline
                rows={3}
              />

              {availablePeople.length > 0 ? (
                availablePeople.map((item) => (
                  <Paper key={item.id} sx={{ p: 2, borderRadius: 4 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle2">{item.fullName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.university} · {item.city}
                        </Typography>
                        {item.careerInterests && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Интересы: {item.careerInterests}
                          </Typography>
                        )}
                      </Box>
                      <Button variant="outlined" onClick={() => handleCreateContact(item.id)}>
                        Добавить в контакты
                      </Button>
                    </Stack>
                  </Paper>
                ))
              ) : (
                <Typography color="text.secondary">
                  Подходящие профили не найдены. Попробуйте изменить поисковый запрос или открыть свой профиль для нетворкинга.
                </Typography>
              )}
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 6 }}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
              <TipsAndUpdatesRoundedIcon color="secondary" />
              <Typography variant="h6">Рекомендации от контактов</Typography>
            </Stack>
            <Stack spacing={1.25}>
              {recommendations.length > 0 ? (
                recommendations.map((item) => (
                  <Paper key={item.id} sx={{ p: 2, borderRadius: 4 }}>
                    <Typography variant="subtitle2">
                      {item.isIncoming ? `От ${item.recommender?.fullName ?? 'контакта'}` : `Для ${item.recommended?.fullName ?? 'контакта'}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.opportunity?.title} · {item.opportunity?.companyName}
                    </Typography>
                    {item.message && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {item.message}
                      </Typography>
                    )}
                    {item.opportunity && (
                      <Button
                        component={RouterLink}
                        to={`/opportunity/${item.opportunity.id}`}
                        variant="text"
                        endIcon={<LaunchRoundedIcon />}
                        sx={{ px: 0, mt: 1 }}
                      >
                        Открыть возможность
                      </Button>
                    )}
                  </Paper>
                ))
              ) : (
                <Typography color="text.secondary">
                  Здесь появятся входящие и исходящие рекомендации по вакансиям, стажировкам и мероприятиям.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </Stack>
  );
};

export default ApplicantDashboard;

