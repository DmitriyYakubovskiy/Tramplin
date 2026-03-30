import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import YandexMap from '../components/maps/YandexMap';
import OpportunityTile from '../components/OpportunityTile';
import { useAuth } from '../components/AuthContext';
import { opportunityService, profileService, tagsService } from '../services/api';
import type { EmployerProfile, Opportunity, OpportunityStatus, OpportunityType, PlatformTag, WorkFormat } from '../types';
import { getErrorMessage } from '../utils/http';
import { getCityCoordinates } from '../utils/map';

interface OpportunityFormState {
  title: string;
  shortDescription: string;
  fullDescription: string;
  type: OpportunityType;
  workFormat: WorkFormat;
  status: OpportunityStatus;
  companyName: string;
  city: string;
  address: string;
  salaryFrom: string;
  salaryTo: string;
  contactEmail: string;
  contactPhone: string;
  externalUrl: string;
  tags: string;
  mediaUrl: string;
  latitude: string;
  longitude: string;
  expiresAt: string;
  eventDate: string;
  isVerifiedOnly: boolean;
}

const initialState: OpportunityFormState = {
  title: '',
  shortDescription: '',
  fullDescription: '',
  type: 'Vacancy',
  workFormat: 'Office',
  status: 'OnModeration',
  companyName: '',
  city: '',
  address: '',
  salaryFrom: '',
  salaryTo: '',
  contactEmail: '',
  contactPhone: '',
  externalUrl: '',
  tags: '',
  mediaUrl: '',
  latitude: '',
  longitude: '',
  expiresAt: '',
  eventDate: '',
  isVerifiedOnly: false,
};

const CreateOpportunityScreen = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [form, setForm] = useState<OpportunityFormState>(initialState);
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [tags, setTags] = useState<PlatformTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canCreate = isAuthenticated && user?.roles.includes('Employer');
  const canEdit = isAuthenticated && (user?.roles.includes('Employer') || user?.roles.includes('Curator') || user?.roles.includes('Admin'));
  const canManage = editId ? canEdit : canCreate;

  useEffect(() => {
    const load = async () => {
      try {
        const [tagData, employerProfile, editingOpportunity] = await Promise.all([
          tagsService.getAll(),
          user?.roles.includes('Employer') ? profileService.getEmployerProfile().catch(() => null) : Promise.resolve(null),
          editId ? opportunityService.getById(editId) : Promise.resolve(null),
        ]);

        setTags(tagData);
        setProfile(employerProfile);

        if (editingOpportunity) {
          setForm({
            title: editingOpportunity.title,
            shortDescription: editingOpportunity.shortDescription,
            fullDescription: editingOpportunity.fullDescription ?? '',
            type: editingOpportunity.type,
            workFormat: editingOpportunity.workFormat,
            status: editingOpportunity.status,
            companyName: editingOpportunity.companyName,
            city: editingOpportunity.city,
            address: editingOpportunity.address ?? '',
            salaryFrom: editingOpportunity.salaryFrom ? String(editingOpportunity.salaryFrom) : '',
            salaryTo: editingOpportunity.salaryTo ? String(editingOpportunity.salaryTo) : '',
            contactEmail: editingOpportunity.contactEmail,
            contactPhone: editingOpportunity.contactPhone ?? '',
            externalUrl: editingOpportunity.externalUrl ?? '',
            tags: editingOpportunity.tags,
            mediaUrl: editingOpportunity.mediaUrl ?? '',
            latitude: editingOpportunity.latitude ? String(editingOpportunity.latitude) : '',
            longitude: editingOpportunity.longitude ? String(editingOpportunity.longitude) : '',
            expiresAt: editingOpportunity.expiresAt ? editingOpportunity.expiresAt.slice(0, 10) : '',
            eventDate: editingOpportunity.eventDate ? editingOpportunity.eventDate.slice(0, 10) : '',
            isVerifiedOnly: editingOpportunity.isVerifiedOnly,
          });
        } else if (employerProfile) {
          setForm((current) => ({
            ...current,
            companyName: employerProfile.companyName,
            city: employerProfile.city ?? '',
            address: employerProfile.officeAddress ?? '',
            contactEmail: employerProfile.user?.email ?? current.contactEmail,
          }));
        }
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Не удалось загрузить форму публикации.'));
      }
    };

    void load();
  }, [editId, user?.roles]);

  const preview = useMemo<Opportunity>(
    () => ({
      id: editId ?? 'preview',
      title: form.title || 'Название карточки',
      shortDescription: form.shortDescription || 'Краткое описание поможет соискателю быстро понять формат и ценность возможности.',
      fullDescription: form.fullDescription,
      type: form.type,
      workFormat: form.workFormat,
      status: form.status,
      companyName: form.companyName || profile?.companyName || 'Компания',
      city: form.city || 'Город',
      address: form.address,
      salaryFrom: form.salaryFrom ? Number(form.salaryFrom) : null,
      salaryTo: form.salaryTo ? Number(form.salaryTo) : null,
      contactEmail: form.contactEmail || profile?.user?.email || 'hr@company.ru',
      contactPhone: form.contactPhone,
      externalUrl: form.externalUrl,
      tags: form.tags,
      mediaUrl: form.mediaUrl,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      publishedAt: new Date().toISOString(),
      expiresAt: form.expiresAt || null,
      eventDate: form.eventDate || null,
      isVerifiedOnly: form.isVerifiedOnly,
      employer: profile,
    }),
    [editId, form, profile],
  );

  const mapCenter = useMemo<[number, number]>(() => {
    if (form.latitude && form.longitude) {
      return [Number(form.latitude), Number(form.longitude)];
    }

    return getCityCoordinates(form.city) ?? [55.751244, 37.618423];
  }, [form.city, form.latitude, form.longitude]);

  const setField = <K extends keyof OpportunityFormState>(key: K, value: OpportunityFormState[K]) => {
    setForm((current) => {
      const next = { ...current, [key]: value };

      if ((key === 'city' || key === 'workFormat') && !current.latitude && !current.longitude) {
        const coordinates = getCityCoordinates(String(key === 'city' ? value : next.city));
        if (coordinates && String(key === 'workFormat' ? value : next.workFormat) === 'Remote') {
          next.latitude = String(coordinates[0]);
          next.longitude = String(coordinates[1]);
        }
      }

      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canManage) {
      setError('Публикация доступна только после входа под работодателем или администратором.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      ...form,
      salaryFrom: form.salaryFrom ? Number(form.salaryFrom) : null,
      salaryTo: form.salaryTo ? Number(form.salaryTo) : null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      expiresAt: form.expiresAt || null,
      eventDate: form.eventDate || null,
    };

    try {
      if (editId) {
        await opportunityService.update(editId, {
          ...payload,
          moderationComment: '',
          isDeleted: false,
        });
        setSuccess('Карточка обновлена.');
      } else {
        const created = await opportunityService.create(payload);
        setSuccess(
          created.status === 'Planned'
            ? 'Карточка сохранена как запланированная. Соискатели увидят её только после перевода в активный статус.'
            : created.status === 'Active'
              ? 'Карточка опубликована и уже видна соискателям в каталоге.'
            : created.status === 'Draft'
              ? 'Карточка сохранена как черновик. Она пока не видна соискателям.'
              : 'Карточка отправлена на модерацию. Соискатели увидят её после публикации в активный статус.',
        );
      }

      setTimeout(() => navigate('/dashboard'), 900);
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Не удалось сохранить карточку.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 }, pb: { xs: 5, md: 8 } }}>
      <Stack spacing={3}>
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 7 }}>
          <Typography variant="h3" gutterBottom>
            {editId ? 'Редактирование карточки' : 'Новая карточка возможности'}
          </Typography>
          <Typography color="text.secondary">
            Работодатель может сохранять черновики и запланированные карточки, а в открытый каталог для соискателей попадают только активные публикации после модерации.
          </Typography>
        </Paper>

        {profile && !profile.isVerified && (
          <Alert severity="warning">
            Компания пока не верифицирована. Публикации станут доступны после проверки куратора.
          </Alert>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            alignItems: 'start',
            gridTemplateColumns: { xs: '1fr', xl: '1.1fr 0.9fr' },
          }}
        >
          <Stack component="form" spacing={3} onSubmit={handleSubmit}>
            <Paper sx={{ p: 3, borderRadius: 6 }}>
              <Stack spacing={2}>
                <Typography variant="h5">Основные данные</Typography>
                <TextField label="Название" value={form.title} onChange={(event) => setField('title', event.target.value)} required />
                <TextField label="Краткое описание" value={form.shortDescription} onChange={(event) => setField('shortDescription', event.target.value)} required multiline rows={3} />
                <TextField label="Полное описание" value={form.fullDescription} onChange={(event) => setField('fullDescription', event.target.value)} multiline rows={6} />
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
                  <TextField select label="Тип" value={form.type} onChange={(event) => setField('type', event.target.value as OpportunityType)}>
                    <MenuItem value="Vacancy">Вакансия</MenuItem>
                    <MenuItem value="Internship">Стажировка</MenuItem>
                    <MenuItem value="Mentorship">Менторская программа</MenuItem>
                    <MenuItem value="Event">Карьерное событие</MenuItem>
                  </TextField>
                  <TextField select label="Формат" value={form.workFormat} onChange={(event) => setField('workFormat', event.target.value as WorkFormat)}>
                    <MenuItem value="Office">Офис</MenuItem>
                    <MenuItem value="Hybrid">Гибрид</MenuItem>
                    <MenuItem value="Remote">Удаленно</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label="Статус"
                    value={form.status}
                    onChange={(event) => setField('status', event.target.value as OpportunityStatus)}
                    helperText="Соискателям видны только карточки со статусом «Активно»."
                  >
                    <MenuItem value="Draft">Черновик</MenuItem>
                    <MenuItem value="Planned">Запланировано</MenuItem>
                    <MenuItem value="Active">Опубликовать сразу</MenuItem>
                    <MenuItem value="OnModeration">Отправить на модерацию</MenuItem>
                    <MenuItem value="Closed">Закрыто</MenuItem>
                    <MenuItem value="Archived">Архив</MenuItem>
                  </TextField>
                </Box>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 6 }}>
              <Stack spacing={2}>
                <Typography variant="h5">Компания и контакты</Typography>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                  <TextField label="Компания" value={form.companyName} onChange={(event) => setField('companyName', event.target.value)} required />
                  <TextField label="Город" value={form.city} onChange={(event) => setField('city', event.target.value)} required />
                  <TextField label="Адрес" value={form.address} onChange={(event) => setField('address', event.target.value)} />
                  <TextField label="E-mail для связи" value={form.contactEmail} onChange={(event) => setField('contactEmail', event.target.value)} required />
                  <TextField label="Телефон" value={form.contactPhone} onChange={(event) => setField('contactPhone', event.target.value)} />
                  <TextField label="Внешняя ссылка" value={form.externalUrl} onChange={(event) => setField('externalUrl', event.target.value)} />
                </Box>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 6 }}>
              <Stack spacing={2}>
                <Typography variant="h5">Теги и условия</Typography>
                <TextField
                  label="Теги"
                  value={form.tags}
                  onChange={(event) => setField('tags', event.target.value)}
                  helperText={`Поддерживаемые теги: ${tags.slice(0, 12).map((item) => item.name).join(', ')}`}
                />
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                  <TextField label="Зарплата от" type="number" value={form.salaryFrom} onChange={(event) => setField('salaryFrom', event.target.value)} />
                  <TextField label="Зарплата до" type="number" value={form.salaryTo} onChange={(event) => setField('salaryTo', event.target.value)} />
                  <TextField label="Срок действия" type="date" value={form.expiresAt} onChange={(event) => setField('expiresAt', event.target.value)} InputLabelProps={{ shrink: true }} />
                  <TextField label="Дата события" type="date" value={form.eventDate} onChange={(event) => setField('eventDate', event.target.value)} InputLabelProps={{ shrink: true }} />
                  <TextField label="Медиа URL" value={form.mediaUrl} onChange={(event) => setField('mediaUrl', event.target.value)} />
                </Box>
                <FormControlLabel
                  control={<Switch checked={form.isVerifiedOnly} onChange={(event) => setField('isVerifiedOnly', event.target.checked)} />}
                  label="Только для верифицированных профилей"
                />
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 6 }}>
              <Stack spacing={2}>
                <Typography variant="h5">Точка на карте</Typography>
                <Typography color="text.secondary">
                  Для офлайн-возможностей укажите точную точку на карте кликом. Для удаленного формата можно оставить координаты города компании.
                </Typography>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                  <TextField label="Широта" value={form.latitude} onChange={(event) => setField('latitude', event.target.value)} />
                  <TextField label="Долгота" value={form.longitude} onChange={(event) => setField('longitude', event.target.value)} />
                </Box>
                <Box sx={{ height: { xs: 240, sm: 280 }, borderRadius: 4, overflow: 'hidden' }}>
                  <YandexMap
                    center={mapCenter}
                    zoom={11}
                    fitToMarkers={false}
                    height="100%"
                    onMapClick={(next) => {
                      setField('latitude', String(Number(next[0].toFixed(6))));
                      setField('longitude', String(Number(next[1].toFixed(6))));
                    }}
                    markers={
                      form.latitude && form.longitude
                        ? [
                            {
                              id: 'selected-location',
                              coordinates: [Number(form.latitude), Number(form.longitude)],
                              markerClassName: 'marker-vacancy',
                            },
                          ]
                        : []
                    }
                  />
                </Box>
              </Stack>
            </Paper>

            <Button type="submit" variant="contained" size="large" disabled={loading || !canManage} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              {loading ? 'Сохраняем...' : editId ? 'Сохранить изменения' : 'Создать карточку'}
            </Button>
          </Stack>

          <Stack spacing={3}>
            <Paper sx={{ p: 3, borderRadius: 6 }}>
              <Typography variant="h6" gutterBottom>
                Предпросмотр
              </Typography>
              <OpportunityTile opportunity={preview} showStatus disableNavigation />
            </Paper>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};

export default CreateOpportunityScreen;
