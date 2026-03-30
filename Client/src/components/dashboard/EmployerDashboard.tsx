import { useEffect, useMemo, useState } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LabelRoundedIcon from '@mui/icons-material/LabelRounded';
import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  applicationService,
  opportunityService,
  profileService,
  tagsService,
} from '../../services/api';
import type {
  Application,
  ApplicationStatus,
  EmployerProfile,
  EmployerVerificationStatus,
  Opportunity,
  OpportunityStatus,
  TagCategory,
} from '../../types';
import { getErrorMessage, getErrorStatus } from '../../utils/http';
import {
  applicationStatusLabel,
  formatDate,
  getApplicationColor,
  opportunityStatusLabel,
  verificationStatusLabel,
} from '../../utils/presentation';

interface EmployerFormState {
  companyName: string;
  description: string;
  industry: string;
  logoUrl: string;
  videoPresentationUrl: string;
  websiteUrl: string;
  socialLinks: string;
  verificationMethod: string;
  verificationData: string;
  officeAddress: string;
  city: string;
}

const defaultForm: EmployerFormState = {
  companyName: '',
  description: '',
  industry: '',
  logoUrl: '',
  videoPresentationUrl: '',
  websiteUrl: '',
  socialLinks: '',
  verificationMethod: '',
  verificationData: '',
  officeAddress: '',
  city: '',
};

const mapProfileToForm = (profile: EmployerProfile | null): EmployerFormState => {
  if (!profile) {
    return defaultForm;
  }

  return {
    companyName: profile.companyName,
    description: profile.description ?? '',
    industry: profile.industry ?? '',
    logoUrl: profile.logoUrl ?? '',
    videoPresentationUrl: profile.videoPresentationUrl ?? '',
    websiteUrl: profile.websiteUrl ?? '',
    socialLinks: profile.socialLinks ?? '',
    verificationMethod: profile.verificationMethod ?? '',
    verificationData: profile.verificationData ?? '',
    officeAddress: profile.officeAddress ?? '',
    city: profile.city ?? '',
  };
};

const EmployerDashboard = () => {
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [form, setForm] = useState<EmployerFormState>(defaultForm);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [opportunitySearch, setOpportunitySearch] = useState('');
  const [opportunityStatus, setOpportunityStatus] = useState<OpportunityStatus | ''>('');
  const [applicationSearch, setApplicationSearch] = useState('');
  const [tagName, setTagName] = useState('');
  const [tagCategory, setTagCategory] = useState<TagCategory>('Technology');
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      const loadProfile = async () => {
        try {
          return await profileService.getEmployerProfile();
        } catch (loadError) {
          if (getErrorStatus(loadError) === 404) {
            return null;
          }

          throw loadError;
        }
      };

      try {
        const [profileData, opportunitiesData, applicationsData, tagsData] = await Promise.all([
          loadProfile(),
          opportunityService.getMy().catch(() => [] as Opportunity[]),
          applicationService.getForMyOpportunities().catch(() => [] as Application[]),
          tagsService.getAll().catch(() => []),
        ]);

        setProfile(profileData);
        setForm(mapProfileToForm(profileData));
        setOpportunities(opportunitiesData);
        setApplications(applicationsData);
        setExistingTags(tagsData.map((item) => item.name.toLowerCase()));
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Не удалось загрузить кабинет работодателя.'));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const setField = <K extends keyof EmployerFormState>(key: K, value: EmployerFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const savedProfile = profile
        ? await profileService.updateEmployerProfile({ ...form })
        : await profileService.createEmployerProfile({ ...form });

      setProfile(savedProfile);
      setForm(mapProfileToForm(savedProfile));
      setSuccess(profile ? 'Профиль работодателя обновлен.' : 'Профиль работодателя создан и отправлен на верификацию.');
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Не удалось сохранить профиль работодателя.'));
    } finally {
      setSaving(false);
    }
  };

  const handleApplicationStatus = async (applicationId: string, status: ApplicationStatus) => {
    setError('');
    setSuccess('');

    try {
      await applicationService.updateStatus(applicationId, status);
      setApplications((current) =>
        current.map((item) =>
          item.id === applicationId
            ? {
                ...item,
                status,
              }
            : item,
        ),
      );
      setSuccess('Статус отклика обновлен.');
    } catch (statusError) {
      setError(getErrorMessage(statusError, 'Не удалось обновить статус отклика.'));
    }
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
    setError('');
    setSuccess('');

    try {
      await opportunityService.delete(opportunityId);
      setOpportunities((current) => current.filter((item) => item.id !== opportunityId));
      setSuccess('Карточка возможности удалена.');
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Не удалось удалить карточку.'));
    }
  };

  const handleCreateTag = async () => {
    const normalizedName = tagName.trim();

    if (!normalizedName) {
      setError('Введите название тега.');
      setSuccess('');
      return;
    }

    if (existingTags.includes(normalizedName.toLowerCase())) {
      setError('Такой тег уже есть в каталоге.');
      setSuccess('');
      return;
    }

    setError('');
    setSuccess('');

    try {
      await tagsService.create({ name: normalizedName, category: tagCategory });
      setExistingTags((current) => [...current, normalizedName.toLowerCase()]);
      setTagName('');
      setSuccess('Новый тег добавлен в каталог платформы.');
    } catch (tagError) {
      setError(getErrorMessage(tagError, 'Не удалось создать тег.'));
    }
  };

  const filteredOpportunities = useMemo(() => {
    const search = opportunitySearch.trim().toLowerCase();

    return opportunities.filter((item) => {
      const matchesSearch =
        !search ||
        [item.title, item.city, item.shortDescription, item.tags]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search);

      const matchesStatus = !opportunityStatus || item.status === opportunityStatus;
      return matchesSearch && matchesStatus;
    });
  }, [opportunities, opportunitySearch, opportunityStatus]);

  const filteredApplications = useMemo(() => {
    const search = applicationSearch.trim().toLowerCase();

    return applications.filter((item) =>
      !search ||
      [
        item.opportunity?.title,
        item.applicant?.fullName,
        item.applicant?.university,
        item.applicant?.city,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search),
    );
  }, [applicationSearch, applications]);

  const statusCounts = useMemo(
    () =>
      opportunities.reduce<Record<string, number>>((accumulator, item) => {
        accumulator[item.status] = (accumulator[item.status] ?? 0) + 1;
        return accumulator;
      }, {}),
    [opportunities],
  );

  const activeOpportunityCount = statusCounts.Active ?? 0;

  if (loading) {
    return (
      <Paper sx={{ p: 4, borderRadius: 6 }}>
        <Typography color="text.secondary">Загружаем кабинет работодателя...</Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 7 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} justifyContent="space-between">
          <Box>
            <Chip label="Работодатель" color="secondary" sx={{ mb: 1.5 }} />
            <Typography variant="h3" gutterBottom>
              Компания, публикации и поток откликов
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 760 }}>
              Здесь мы ведем карточку работодателя, проходим верификацию, публикуем возможности, модерируем отклики и
              пополняем каталог платформы отраслевыми тегами.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1.25} sx={{ minWidth: { md: 260 } }}>
            <Paper sx={{ p: 2.25, borderRadius: 5 }}>
              <Typography variant="overline" color="text.secondary">
                Верификация
              </Typography>
              <Typography variant="h6">
                {verificationStatusLabel[(profile?.verificationStatus ?? 'Pending') as EmployerVerificationStatus]}
              </Typography>
            </Paper>
            <Paper sx={{ p: 2.25, borderRadius: 5 }}>
              <Typography variant="overline" color="text.secondary">
                Публикации
              </Typography>
              <Typography variant="h6">{opportunities.length}</Typography>
            </Paper>
          </Stack>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      {profile && !profile.isVerified && (
        <Alert severity="warning">
          Публикация новых возможностей доступна после проверки компании куратором платформы.
          {profile.verificationComment ? ` Комментарий: ${profile.verificationComment}` : ''}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', xl: '1.05fr 0.95fr' },
        }}
      >
        <Paper component="form" onSubmit={handleProfileSubmit} sx={{ p: 3, borderRadius: 6 }}>
          <Stack spacing={2.5}>
            <Typography variant="h5">Карточка компании</Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
              <TextField label="Название компании" value={form.companyName} onChange={(event) => setField('companyName', event.target.value)} required />
              <TextField label="Сфера деятельности" value={form.industry} onChange={(event) => setField('industry', event.target.value)} />
              <TextField label="Город" value={form.city} onChange={(event) => setField('city', event.target.value)} required />
              <TextField label="Адрес офиса" value={form.officeAddress} onChange={(event) => setField('officeAddress', event.target.value)} />
              <TextField label="Сайт" value={form.websiteUrl} onChange={(event) => setField('websiteUrl', event.target.value)} />
              <TextField label="Соцсети / ссылки" value={form.socialLinks} onChange={(event) => setField('socialLinks', event.target.value)} />
              <TextField label="Логотип URL" value={form.logoUrl} onChange={(event) => setField('logoUrl', event.target.value)} />
              <TextField
                label="Видео-презентация URL"
                value={form.videoPresentationUrl}
                onChange={(event) => setField('videoPresentationUrl', event.target.value)}
              />
              <TextField
                label="Способ верификации"
                value={form.verificationMethod}
                onChange={(event) => setField('verificationMethod', event.target.value)}
                required
              />
              <TextField
                label="Данные для верификации"
                value={form.verificationData}
                onChange={(event) => setField('verificationData', event.target.value)}
                required
              />
            </Box>
            <TextField
              label="Описание компании"
              value={form.description}
              onChange={(event) => setField('description', event.target.value)}
              multiline
              rows={5}
            />
            <Button type="submit" variant="contained" size="large" disabled={saving} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              {saving ? 'Сохраняем...' : profile ? 'Обновить профиль компании' : 'Создать профиль компании'}
            </Button>
          </Stack>
        </Paper>

        <Stack spacing={3}>
          <Paper sx={{ p: 3, borderRadius: 6 }}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
              <TravelExploreRoundedIcon color="secondary" />
              <Typography variant="h6">Статус публикаций</Typography>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {Object.entries(statusCounts).length > 0 ? (
                Object.entries(statusCounts).map(([status, count]) => (
                  <Chip key={status} label={`${opportunityStatusLabel[status as OpportunityStatus]}: ${count}`} />
                ))
              ) : (
                <Typography color="text.secondary">Карточек пока нет.</Typography>
              )}
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 1.5 }}>
              Сейчас в каталоге для соискателей видно: {activeOpportunityCount}. Черновики, запланированные и карточки на модерации остаются только в кабинете работодателя.
            </Typography>
            <Button
              component={RouterLink}
              to="/create-opportunity"
              variant="contained"
              startIcon={<AddRoundedIcon />}
              sx={{ mt: 2, width: { xs: '100%', sm: 'auto' } }}
              disabled={!profile?.isVerified}
            >
              Создать возможность
            </Button>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 6 }}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
              <LabelRoundedIcon color="secondary" />
              <Typography variant="h6">Добавить тег</Typography>
            </Stack>
            <Stack spacing={1.5}>
              <TextField label="Название тега" value={tagName} onChange={(event) => setTagName(event.target.value)} />
              <TextField select label="Категория" value={tagCategory} onChange={(event) => setTagCategory(event.target.value as TagCategory)}>
                <MenuItem value="Technology">Технология</MenuItem>
                <MenuItem value="Level">Уровень</MenuItem>
                <MenuItem value="EmploymentType">Тип занятости</MenuItem>
                <MenuItem value="Direction">Направление</MenuItem>
                <MenuItem value="Other">Другое</MenuItem>
              </TextField>
              <Button variant="outlined" onClick={handleCreateTag}>
                Добавить тег в каталог
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 6 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <ApartmentRoundedIcon color="secondary" />
            <Typography variant="h5">Мои возможности</Typography>
          </Stack>
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 240px))' } }}>
            <TextField label="Поиск" value={opportunitySearch} onChange={(event) => setOpportunitySearch(event.target.value)} />
            <TextField select label="Статус" value={opportunityStatus} onChange={(event) => setOpportunityStatus(event.target.value as OpportunityStatus | '')}>
              <MenuItem value="">Все статусы</MenuItem>
              {Object.entries(opportunityStatusLabel).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Stack>

        <Stack spacing={1.5}>
          {filteredOpportunities.length > 0 ? (
            filteredOpportunities.map((item) => (
              <Paper key={item.id} sx={{ p: 2.25, borderRadius: 4 }}>
                <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} justifyContent="space-between">
                  <Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                      <Chip label={opportunityStatusLabel[item.status]} />
                      <Chip label={item.city} variant="outlined" />
                    </Stack>
                    <Typography variant="subtitle1">{item.title}</Typography>
                    <Typography color="text.secondary">{item.shortDescription}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Обновлено {formatDate(item.publishedAt)}
                    </Typography>
                    {item.moderationComment && (
                      <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                        Комментарий модерации: {item.moderationComment}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction={{ xs: 'column', sm: 'row', lg: 'column' }} spacing={1}>
                    <Button component={RouterLink} to={`/opportunity/${item.id}`} variant="outlined">
                      Открыть
                    </Button>
                    <Button
                      component={RouterLink}
                      to={`/create-opportunity?edit=${item.id}`}
                      variant="outlined"
                      startIcon={<EditRoundedIcon />}
                    >
                      Редактировать
                    </Button>
                    <Button color="error" variant="text" onClick={() => handleDeleteOpportunity(item.id)}>
                      Удалить
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ))
          ) : (
            <Typography color="text.secondary">По выбранным фильтрам карточки не найдены.</Typography>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 6 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <ChecklistRoundedIcon color="secondary" />
            <Typography variant="h5">Отклики соискателей</Typography>
          </Stack>
          <TextField
            label="Поиск по откликам"
            value={applicationSearch}
            onChange={(event) => setApplicationSearch(event.target.value)}
            sx={{ width: { xs: '100%', md: 320 } }}
          />
        </Stack>

        <Stack spacing={1.5}>
          {filteredApplications.length > 0 ? (
            filteredApplications.map((item) => (
              <Paper key={item.id} sx={{ p: 2.25, borderRadius: 4 }}>
                <Stack direction={{ xs: 'column', xl: 'row' }} spacing={2} justifyContent="space-between">
                  <Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                      <Chip label={applicationStatusLabel[item.status]} color={getApplicationColor(item.status)} />
                      <Chip label={item.opportunity?.title ?? 'Карточка'} variant="outlined" />
                    </Stack>
                    <Typography variant="subtitle1">{item.applicant?.fullName ?? 'Соискатель'}</Typography>
                    <Typography color="text.secondary">
                      {item.applicant?.university} · {item.applicant?.courseOrGraduationYear} · {item.applicant?.city}
                    </Typography>
                    {item.applicant?.portfolioUrl && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Портфолио: {item.applicant.portfolioUrl}
                      </Typography>
                    )}
                    {item.applicant?.resumeFileUrl && (
                      <Typography variant="body2" color="text.secondary">
                        Резюме: {item.applicant.resumeFileUrl}
                      </Typography>
                    )}
                    {item.applicant?.contactEmail && (
                      <Typography variant="body2" color="text.secondary">
                        Контакт: {item.applicant.contactEmail}
                      </Typography>
                    )}
                  </Box>
                  <Stack spacing={1}>
                    <TextField
                      select
                      size="small"
                      label="Статус"
                      value={item.status}
                      onChange={(event) => handleApplicationStatus(item.id, event.target.value as ApplicationStatus)}
                      sx={{ minWidth: { xs: '100%', sm: 220 } }}
                    >
                      {Object.entries(applicationStatusLabel).map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </TextField>
                    {item.opportunity && (
                      <Button component={RouterLink} to={`/opportunity/${item.opportunity.id}`} variant="outlined">
                        Открыть вакансию
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            ))
          ) : (
            <Typography color="text.secondary">Пока нет откликов или они не подходят под текущий поиск.</Typography>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
};

export default EmployerDashboard;
