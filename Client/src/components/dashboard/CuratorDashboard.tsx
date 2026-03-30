import { useCallback, useEffect, useMemo, useState } from 'react';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import LabelRoundedIcon from '@mui/icons-material/LabelRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
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
import { useAuth } from '../AuthContext';
import {
  curatorService,
  moderationService,
  profileService,
  tagsService,
} from '../../services/api';
import type {
  ApplicantProfile,
  CuratorProfile,
  EmployerProfile,
  EmployerVerificationStatus,
  Opportunity,
  OpportunityStatus,
  TagCategory,
} from '../../types';
import { getErrorMessage } from '../../utils/http';
import { opportunityStatusLabel, verificationStatusLabel } from '../../utils/presentation';

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

const defaultEmployerForm: EmployerFormState = {
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

const defaultApplicantForm: ApplicantFormState = {
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

const mapEmployerToForm = (profile: EmployerProfile | null): EmployerFormState => {
  if (!profile) {
    return defaultEmployerForm;
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

const mapApplicantToForm = (profile: ApplicantProfile | null): ApplicantFormState => {
  if (!profile) {
    return defaultApplicantForm;
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

const CuratorDashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;

  const [moderationEmployers, setModerationEmployers] = useState<EmployerProfile[]>([]);
  const [moderationOpportunities, setModerationOpportunities] = useState<Opportunity[]>([]);
  const [employerDirectory, setEmployerDirectory] = useState<EmployerProfile[]>([]);
  const [applicantDirectory, setApplicantDirectory] = useState<ApplicantProfile[]>([]);
  const [curators, setCurators] = useState<CuratorProfile[]>([]);
  const [selectedEmployerId, setSelectedEmployerId] = useState('');
  const [selectedApplicantId, setSelectedApplicantId] = useState('');
  const [selectedEmployer, setSelectedEmployer] = useState<EmployerProfile | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantProfile | null>(null);
  const [employerForm, setEmployerForm] = useState<EmployerFormState>(defaultEmployerForm);
  const [applicantForm, setApplicantForm] = useState<ApplicantFormState>(defaultApplicantForm);
  const [employerVerificationState, setEmployerVerificationState] = useState<Record<string, EmployerVerificationStatus>>({});
  const [employerVerificationComment, setEmployerVerificationComment] = useState<Record<string, string>>({});
  const [opportunityModerationState, setOpportunityModerationState] = useState<Record<string, OpportunityStatus>>({});
  const [opportunityModerationComment, setOpportunityModerationComment] = useState<Record<string, string>>({});
  const [tagName, setTagName] = useState('');
  const [tagCategory, setTagCategory] = useState<TagCategory>('Technology');
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [curatorForm, setCuratorForm] = useState({
    fullName: '',
    email: '',
    password: '',
    organizationName: '',
    position: '',
    isAdmin: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const verificationSummary = useMemo(
    () =>
      moderationEmployers.reduce<Record<string, number>>((accumulator, item) => {
        const status = item.verificationStatus ?? 'Pending';
        accumulator[status] = (accumulator[status] ?? 0) + 1;
        return accumulator;
      }, {}),
    [moderationEmployers],
  );

  const moderationSummary = useMemo(
    () =>
      moderationOpportunities.reduce<Record<string, number>>((accumulator, item) => {
        accumulator[item.status] = (accumulator[item.status] ?? 0) + 1;
        return accumulator;
      }, {}),
    [moderationOpportunities],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [employersData, opportunitiesData, employerDirectoryData, applicantDirectoryData, curatorsData, tagsData] =
        await Promise.all([
          moderationService.getEmployers(),
          moderationService.getOpportunities(),
          profileService.getEmployerDirectory(),
          profileService.getApplicantDirectory(),
          isAdmin ? curatorService.getAll() : Promise.resolve([] as CuratorProfile[]),
          tagsService.getAll().catch(() => []),
        ]);

      setModerationEmployers(employersData);
      setModerationOpportunities(opportunitiesData);
      setEmployerDirectory(employerDirectoryData);
      setApplicantDirectory(applicantDirectoryData);
      setCurators(curatorsData);
      setEmployerVerificationState(
        Object.fromEntries(employersData.map((item) => [item.id, item.verificationStatus ?? 'Pending'])),
      );
      setEmployerVerificationComment(
        Object.fromEntries(employersData.map((item) => [item.id, item.verificationComment ?? ''])),
      );
      setOpportunityModerationState(Object.fromEntries(opportunitiesData.map((item) => [item.id, item.status])));
      setOpportunityModerationComment(
        Object.fromEntries(opportunitiesData.map((item) => [item.id, item.moderationComment ?? ''])),
      );
      setExistingTags(tagsData.map((item) => item.name.toLowerCase()));
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Не удалось загрузить кабинет куратора.'));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedEmployerId) {
      setSelectedEmployer(null);
      setEmployerForm(defaultEmployerForm);
      return;
    }

    const loadEmployer = async () => {
      try {
        const profile = await profileService.getEmployerById(selectedEmployerId);
        setSelectedEmployer(profile);
        setEmployerForm(mapEmployerToForm(profile));
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Не удалось загрузить профиль работодателя.'));
      }
    };

    void loadEmployer();
  }, [selectedEmployerId]);

  useEffect(() => {
    if (!selectedApplicantId) {
      setSelectedApplicant(null);
      setApplicantForm(defaultApplicantForm);
      return;
    }

    const loadApplicant = async () => {
      try {
        const profile = await profileService.getApplicantById(selectedApplicantId);
        setSelectedApplicant(profile);
        setApplicantForm(mapApplicantToForm(profile));
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Не удалось загрузить профиль соискателя.'));
      }
    };

    void loadApplicant();
  }, [selectedApplicantId]);

  const handleEmployerModeration = async (id: string) => {
    setError('');
    setSuccess('');

    try {
      await moderationService.updateEmployerVerification(id, {
        status: employerVerificationState[id] ?? 'Pending',
        comment: employerVerificationComment[id] || undefined,
      });
      await loadData();
      setSuccess('Статус верификации работодателя обновлен.');
    } catch (moderationError) {
      setError(getErrorMessage(moderationError, 'Не удалось обновить статус верификации.'));
    }
  };

  const handleOpportunityModeration = async (id: string) => {
    setError('');
    setSuccess('');

    try {
      await moderationService.updateOpportunity(id, {
        status: opportunityModerationState[id] ?? 'OnModeration',
        moderationComment: opportunityModerationComment[id] || undefined,
      });
      await loadData();
      setSuccess('Статус карточки обновлен.');
    } catch (moderationError) {
      setError(getErrorMessage(moderationError, 'Не удалось обновить карточку возможности.'));
    }
  };

  const handleEmployerSave = async () => {
    if (!selectedEmployerId) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const saved = await profileService.updateEmployerProfileByCurator(selectedEmployerId, { ...employerForm });
      setSelectedEmployer(saved);
      setEmployerDirectory((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      setSuccess('Профиль работодателя обновлен куратором.');
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Не удалось обновить профиль работодателя.'));
    }
  };

  const handleApplicantSave = async () => {
    if (!selectedApplicantId) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const saved = await profileService.updateApplicantProfileByCurator(selectedApplicantId, { ...applicantForm });
      setSelectedApplicant(saved);
      setApplicantDirectory((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      setSuccess('Профиль соискателя обновлен куратором.');
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Не удалось обновить профиль соискателя.'));
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
      setSuccess('Тег добавлен в каталог.');
    } catch (tagError) {
      setError(getErrorMessage(tagError, 'Не удалось добавить тег.'));
    }
  };

  const handleCreateCurator = async () => {
    setError('');
    setSuccess('');

    try {
      await curatorService.create(curatorForm);
      setCuratorForm({
        fullName: '',
        email: '',
        password: '',
        organizationName: '',
        position: '',
        isAdmin: false,
      });
      await loadData();
      setSuccess('Учетная запись куратора создана.');
    } catch (createError) {
      setError(getErrorMessage(createError, 'Не удалось создать куратора.'));
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 4, borderRadius: 6 }}>
        <Typography color="text.secondary">Загружаем кабинет куратора...</Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 7 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} justifyContent="space-between">
          <Box>
            <Chip label={isAdmin ? 'Администратор' : 'Куратор'} color="secondary" sx={{ mb: 1.5 }} />
            <Typography variant="h3" gutterBottom>
              Модерация компаний, карточек и профилей
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 780 }}>
              Здесь мы проверяем работодателей, управляем карточками возможностей, корректируем профили участников и
              поддерживаем каталоги платформы в актуальном состоянии.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1.25} sx={{ minWidth: { md: 280 } }}>
            <Paper sx={{ p: 2.25, borderRadius: 5 }}>
              <Typography variant="overline" color="text.secondary">
                Работодатели на проверке
              </Typography>
              <Typography variant="h6">{moderationEmployers.length}</Typography>
            </Paper>
            <Paper sx={{ p: 2.25, borderRadius: 5 }}>
              <Typography variant="overline" color="text.secondary">
                Карточки на модерации
              </Typography>
              <Typography variant="h6">{moderationOpportunities.length}</Typography>
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
          gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' },
        }}
      >
        <Paper sx={{ p: 3, borderRadius: 6 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
            <FactCheckRoundedIcon color="secondary" />
            <Typography variant="h6">Верификация работодателей</Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            {Object.entries(verificationSummary).map(([status, count]) => (
              <Chip key={status} label={`${verificationStatusLabel[status as EmployerVerificationStatus]}: ${count}`} />
            ))}
          </Stack>
          <Stack spacing={1.5}>
            {moderationEmployers.length > 0 ? (
              moderationEmployers.map((item) => (
                <Paper key={item.id} sx={{ p: 2.25, borderRadius: 4 }}>
                  <Stack spacing={1.25}>
                    <Typography variant="subtitle1">{item.companyName}</Typography>
                    <Typography color="text.secondary">
                      {item.industry} · {item.city} · {item.user?.email}
                    </Typography>
                    {item.verificationMethod && (
                      <Typography variant="body2" color="text.secondary">
                        Верификация: {item.verificationMethod} — {item.verificationData}
                      </Typography>
                    )}
                    <TextField
                      select
                      size="small"
                      label="Статус проверки"
                      value={employerVerificationState[item.id] ?? item.verificationStatus ?? 'Pending'}
                      onChange={(event) =>
                        setEmployerVerificationState((current) => ({
                          ...current,
                          [item.id]: event.target.value as EmployerVerificationStatus,
                        }))
                      }
                    >
                      {Object.entries(verificationStatusLabel).map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="Комментарий"
                      value={employerVerificationComment[item.id] ?? ''}
                      onChange={(event) =>
                        setEmployerVerificationComment((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      multiline
                      rows={2}
                    />
                    <Button variant="contained" onClick={() => handleEmployerModeration(item.id)}>
                      Сохранить решение
                    </Button>
                  </Stack>
                </Paper>
              ))
            ) : (
              <Typography color="text.secondary">Очередь верификации сейчас пуста.</Typography>
            )}
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 6 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
            <GavelRoundedIcon color="secondary" />
            <Typography variant="h6">Карточки на модерации</Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            {Object.entries(moderationSummary).map(([status, count]) => (
              <Chip key={status} label={`${opportunityStatusLabel[status as OpportunityStatus]}: ${count}`} />
            ))}
          </Stack>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            В очереди модерации показываются карточки со статусами «На модерации» и «Запланировано», чтобы куратор не терял новые публикации.
          </Typography>
          <Stack spacing={1.5}>
            {moderationOpportunities.length > 0 ? (
              moderationOpportunities.map((item) => (
                <Paper key={item.id} sx={{ p: 2.25, borderRadius: 4 }}>
                  <Stack spacing={1.25}>
                    <Typography variant="subtitle1">{item.title}</Typography>
                    <Typography color="text.secondary">
                      {item.companyName} · {item.city} · {item.tags}
                    </Typography>
                    <TextField
                      select
                      size="small"
                      label="Статус карточки"
                      value={opportunityModerationState[item.id] ?? item.status}
                      onChange={(event) =>
                        setOpportunityModerationState((current) => ({
                          ...current,
                          [item.id]: event.target.value as OpportunityStatus,
                        }))
                      }
                    >
                      {Object.entries(opportunityStatusLabel).map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="Комментарий модерации"
                      value={opportunityModerationComment[item.id] ?? ''}
                      onChange={(event) =>
                        setOpportunityModerationComment((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      multiline
                      rows={2}
                    />
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                      <Button variant="contained" onClick={() => handleOpportunityModeration(item.id)}>
                        Сохранить решение
                      </Button>
                      <Button
                        component={RouterLink}
                        to={`/create-opportunity?edit=${item.id}`}
                        variant="outlined"
                        startIcon={<EditRoundedIcon />}
                      >
                        Править наполнение
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))
            ) : (
              <Typography color="text.secondary">Сейчас нет карточек в очереди модерации.</Typography>
            )}
          </Stack>
        </Paper>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' },
        }}
      >
        <Paper sx={{ p: 3, borderRadius: 6 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
            <ManageAccountsRoundedIcon color="secondary" />
            <Typography variant="h6">Редактирование работодателей</Typography>
          </Stack>
          <Stack spacing={2}>
            <TextField
              select
              label="Выберите работодателя"
              value={selectedEmployerId}
              onChange={(event) => setSelectedEmployerId(event.target.value)}
            >
              <MenuItem value="">Не выбрано</MenuItem>
              {employerDirectory.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.companyName}
                </MenuItem>
              ))}
            </TextField>

            {selectedEmployer ? (
              <>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                  <TextField label="Компания" value={employerForm.companyName} onChange={(event) => setEmployerForm((current) => ({ ...current, companyName: event.target.value }))} />
                  <TextField label="Индустрия" value={employerForm.industry} onChange={(event) => setEmployerForm((current) => ({ ...current, industry: event.target.value }))} />
                  <TextField label="Город" value={employerForm.city} onChange={(event) => setEmployerForm((current) => ({ ...current, city: event.target.value }))} />
                  <TextField label="Адрес офиса" value={employerForm.officeAddress} onChange={(event) => setEmployerForm((current) => ({ ...current, officeAddress: event.target.value }))} />
                  <TextField label="Сайт" value={employerForm.websiteUrl} onChange={(event) => setEmployerForm((current) => ({ ...current, websiteUrl: event.target.value }))} />
                  <TextField label="Соцсети" value={employerForm.socialLinks} onChange={(event) => setEmployerForm((current) => ({ ...current, socialLinks: event.target.value }))} />
                  <TextField label="Логотип URL" value={employerForm.logoUrl} onChange={(event) => setEmployerForm((current) => ({ ...current, logoUrl: event.target.value }))} />
                  <TextField label="Видео URL" value={employerForm.videoPresentationUrl} onChange={(event) => setEmployerForm((current) => ({ ...current, videoPresentationUrl: event.target.value }))} />
                  <TextField label="Метод верификации" value={employerForm.verificationMethod} onChange={(event) => setEmployerForm((current) => ({ ...current, verificationMethod: event.target.value }))} />
                  <TextField label="Данные верификации" value={employerForm.verificationData} onChange={(event) => setEmployerForm((current) => ({ ...current, verificationData: event.target.value }))} />
                </Box>
                <TextField
                  label="Описание"
                  value={employerForm.description}
                  onChange={(event) => setEmployerForm((current) => ({ ...current, description: event.target.value }))}
                  multiline
                  rows={4}
                />
                <Button variant="contained" onClick={handleEmployerSave}>
                  Сохранить профиль работодателя
                </Button>
              </>
            ) : (
              <Typography color="text.secondary">Выберите работодателя из каталога, чтобы изменить его профиль.</Typography>
            )}
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 6 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
            <PeopleAltRoundedIcon color="secondary" />
            <Typography variant="h6">Редактирование соискателей</Typography>
          </Stack>
          <Stack spacing={2}>
            <TextField
              select
              label="Выберите соискателя"
              value={selectedApplicantId}
              onChange={(event) => setSelectedApplicantId(event.target.value)}
            >
              <MenuItem value="">Не выбрано</MenuItem>
              {applicantDirectory.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.fullName}
                </MenuItem>
              ))}
            </TextField>

            {selectedApplicant ? (
              <>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                  <TextField label="ФИО" value={applicantForm.fullName} onChange={(event) => setApplicantForm((current) => ({ ...current, fullName: event.target.value }))} />
                  <TextField label="Город" value={applicantForm.city} onChange={(event) => setApplicantForm((current) => ({ ...current, city: event.target.value }))} />
                  <TextField label="Вуз" value={applicantForm.university} onChange={(event) => setApplicantForm((current) => ({ ...current, university: event.target.value }))} />
                  <TextField label="Факультет" value={applicantForm.faculty} onChange={(event) => setApplicantForm((current) => ({ ...current, faculty: event.target.value }))} />
                  <TextField label="Курс / выпуск" value={applicantForm.courseOrGraduationYear} onChange={(event) => setApplicantForm((current) => ({ ...current, courseOrGraduationYear: event.target.value }))} />
                  <TextField label="Интересы" value={applicantForm.careerInterests} onChange={(event) => setApplicantForm((current) => ({ ...current, careerInterests: event.target.value }))} />
                  <TextField label="GitHub" value={applicantForm.gitHubUrl} onChange={(event) => setApplicantForm((current) => ({ ...current, gitHubUrl: event.target.value }))} />
                  <TextField label="Портфолио" value={applicantForm.portfolioUrl} onChange={(event) => setApplicantForm((current) => ({ ...current, portfolioUrl: event.target.value }))} />
                  <TextField label="Резюме URL" value={applicantForm.resumeFileUrl} onChange={(event) => setApplicantForm((current) => ({ ...current, resumeFileUrl: event.target.value }))} />
                </Box>
                <TextField
                  label="О себе"
                  value={applicantForm.about}
                  onChange={(event) => setApplicantForm((current) => ({ ...current, about: event.target.value }))}
                  multiline
                  rows={3}
                />
                <TextField
                  label="Навыки"
                  value={applicantForm.skills}
                  onChange={(event) => setApplicantForm((current) => ({ ...current, skills: event.target.value }))}
                  multiline
                  rows={3}
                />
                <TextField
                  label="Проекты"
                  value={applicantForm.projectExperience}
                  onChange={(event) => setApplicantForm((current) => ({ ...current, projectExperience: event.target.value }))}
                  multiline
                  rows={3}
                />
                <Button variant="contained" onClick={handleApplicantSave}>
                  Сохранить профиль соискателя
                </Button>
              </>
            ) : (
              <Typography color="text.secondary">Выберите соискателя из каталога, чтобы изменить его профиль.</Typography>
            )}
          </Stack>
        </Paper>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', xl: isAdmin ? '1fr 1fr' : '1fr' },
        }}
      >
        <Paper sx={{ p: 3, borderRadius: 6 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
            <LabelRoundedIcon color="secondary" />
            <Typography variant="h6">Управление тегами</Typography>
          </Stack>
          <Stack spacing={1.5}>
            <TextField label="Новый тег" value={tagName} onChange={(event) => setTagName(event.target.value)} />
            <TextField select label="Категория" value={tagCategory} onChange={(event) => setTagCategory(event.target.value as TagCategory)}>
              <MenuItem value="Technology">Технология</MenuItem>
              <MenuItem value="Level">Уровень</MenuItem>
              <MenuItem value="EmploymentType">Тип занятости</MenuItem>
              <MenuItem value="Direction">Направление</MenuItem>
              <MenuItem value="Other">Другое</MenuItem>
            </TextField>
            <Button variant="outlined" onClick={handleCreateTag}>
              Добавить тег
            </Button>
          </Stack>
        </Paper>

        {isAdmin && (
          <Paper sx={{ p: 3, borderRadius: 6 }}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
              <BadgeRoundedIcon color="secondary" />
              <Typography variant="h6">Учетные записи кураторов</Typography>
            </Stack>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                <TextField label="ФИО" value={curatorForm.fullName} onChange={(event) => setCuratorForm((current) => ({ ...current, fullName: event.target.value }))} />
                <TextField label="Организация" value={curatorForm.organizationName} onChange={(event) => setCuratorForm((current) => ({ ...current, organizationName: event.target.value }))} />
                <TextField label="Должность" value={curatorForm.position} onChange={(event) => setCuratorForm((current) => ({ ...current, position: event.target.value }))} />
                <TextField label="E-mail" value={curatorForm.email} onChange={(event) => setCuratorForm((current) => ({ ...current, email: event.target.value }))} />
                <TextField label="Пароль" type="password" value={curatorForm.password} onChange={(event) => setCuratorForm((current) => ({ ...current, password: event.target.value }))} />
                <TextField
                  select
                  label="Роль"
                  value={curatorForm.isAdmin ? 'Admin' : 'Curator'}
                  onChange={(event) => setCuratorForm((current) => ({ ...current, isAdmin: event.target.value === 'Admin' }))}
                >
                  <MenuItem value="Curator">Куратор</MenuItem>
                  <MenuItem value="Admin">Администратор</MenuItem>
                </TextField>
              </Box>
              <Button variant="contained" onClick={handleCreateCurator}>
                Создать учетную запись
              </Button>

              <Stack spacing={1}>
                {curators.map((item) => (
                  <Paper key={item.id} sx={{ p: 2, borderRadius: 4 }}>
                    <Typography variant="subtitle2">{item.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.organizationName} · {item.position} · {item.user?.email}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </Stack>
          </Paper>
        )}
      </Box>
    </Stack>
  );
};

export default CuratorDashboard;
