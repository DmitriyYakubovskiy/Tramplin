import React, { useMemo, useState } from 'react';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
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
import { useNavigate } from 'react-router-dom';
import OpportunityCard from '../components/OpportunityCard';
import { useAuth } from '../components/AuthContext';
import { opportunityService } from '../services/api';
import type { Opportunity, OpportunityType, WorkFormat } from '../types';
import { getErrorMessage } from '../utils/http';

interface OpportunityFormState {
  title: string;
  shortDescription: string;
  fullDescription: string;
  type: OpportunityType;
  workFormat: WorkFormat;
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

const CreateOpportunityView: React.FC = () => {
  const [formData, setFormData] = useState<OpportunityFormState>(initialState);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const canCreate = isAuthenticated && (user?.roles.includes('Employer') || user?.roles.includes('Admin'));

  const previewOpportunity = useMemo<Opportunity>(
    () => ({
      id: 'preview',
      title: formData.title || 'Название карточки',
      shortDescription:
        formData.shortDescription ||
        'Краткое описание поможет соискателю быстро понять ценность карточки и формат участия.',
      fullDescription: formData.fullDescription,
      type: formData.type,
      workFormat: formData.workFormat,
      status: 'Active',
      companyName: formData.companyName || user?.displayName || 'Компания',
      city: formData.city || 'Город',
      address: formData.address,
      salaryFrom: formData.salaryFrom ? Number(formData.salaryFrom) : undefined,
      salaryTo: formData.salaryTo ? Number(formData.salaryTo) : undefined,
      contactEmail: formData.contactEmail || 'hr@company.ru',
      contactPhone: formData.contactPhone,
      externalUrl: formData.externalUrl,
      tags: formData.tags,
      mediaUrl: formData.mediaUrl,
      latitude: formData.latitude ? Number(formData.latitude) : undefined,
      longitude: formData.longitude ? Number(formData.longitude) : undefined,
      publishedAt: new Date().toISOString(),
      expiresAt: formData.expiresAt || undefined,
      eventDate: formData.eventDate || undefined,
      isVerifiedOnly: formData.isVerifiedOnly,
    }),
    [formData, user?.displayName],
  );

  const updateField = <K extends keyof OpportunityFormState>(field: K, value: OpportunityFormState[K]) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canCreate) {
      setError('Публикация доступна только работодателям после входа в систему.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await opportunityService.create({
        ...formData,
        salaryFrom: formData.salaryFrom ? Number(formData.salaryFrom) : null,
        salaryTo: formData.salaryTo ? Number(formData.salaryTo) : null,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        expiresAt: formData.expiresAt || null,
        eventDate: formData.eventDate || null,
      });

      setSuccess('Карточка опубликована. Возвращаем вас в кабинет работодателя...');
      setTimeout(() => navigate('/dashboard'), 1400);
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Не удалось создать карточку.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 }, pb: 8 }}>
      <Stack spacing={3}>
        <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 8 }}>
          <Stack spacing={1.5}>
            <Typography variant="h3">Создание новой карточки возможности</Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 860 }}>
              Здесь можно оформить вакансию, стажировку, менторскую программу или карьерное событие.
              Интерфейс помогает сразу увидеть, как карточка будет смотреться в ленте и на карте.
            </Typography>
          </Stack>
        </Paper>

        {!canCreate && (
          <Alert severity="warning">
            Для публикации карточек нужно войти под работодателем или администратором и иметь заполненный профиль компании.
          </Alert>
        )}

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            alignItems: 'start',
            gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.15fr) minmax(360px, 0.85fr)' },
          }}
        >
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 7 }}>
              <Stack spacing={2}>
                <Typography variant="h5">Основная информация</Typography>
                <TextField
                  label="Название позиции или события"
                  value={formData.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label="Краткое описание"
                  value={formData.shortDescription}
                  onChange={(event) => updateField('shortDescription', event.target.value)}
                  required
                  fullWidth
                  multiline
                  rows={3}
                />
                <TextField
                  label="Полное описание"
                  value={formData.fullDescription}
                  onChange={(event) => updateField('fullDescription', event.target.value)}
                  fullWidth
                  multiline
                  rows={6}
                />
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  }}
                >
                  <TextField
                    select
                    label="Тип возможности"
                    value={formData.type}
                    onChange={(event) => updateField('type', event.target.value as OpportunityType)}
                    fullWidth
                  >
                    <MenuItem value="Vacancy">Вакансия</MenuItem>
                    <MenuItem value="Internship">Стажировка</MenuItem>
                    <MenuItem value="Mentorship">Менторская программа</MenuItem>
                    <MenuItem value="Event">Карьерное событие</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label="Формат"
                    value={formData.workFormat}
                    onChange={(event) => updateField('workFormat', event.target.value as WorkFormat)}
                    fullWidth
                  >
                    <MenuItem value="Office">Офис</MenuItem>
                    <MenuItem value="Hybrid">Гибрид</MenuItem>
                    <MenuItem value="Remote">Удалённо</MenuItem>
                  </TextField>
                </Box>
              </Stack>
            </Paper>

            <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 7 }}>
              <Stack spacing={2}>
                <Typography variant="h5">Компания, локация и контакты</Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  }}
                >
                  <TextField
                    label="Название компании"
                    value={formData.companyName}
                    onChange={(event) => updateField('companyName', event.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Город"
                    value={formData.city}
                    onChange={(event) => updateField('city', event.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Точный адрес"
                    value={formData.address}
                    onChange={(event) => updateField('address', event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Контактный e-mail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(event) => updateField('contactEmail', event.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Телефон"
                    value={formData.contactPhone}
                    onChange={(event) => updateField('contactPhone', event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Внешняя ссылка"
                    value={formData.externalUrl}
                    onChange={(event) => updateField('externalUrl', event.target.value)}
                    fullWidth
                  />
                </Box>
              </Stack>
            </Paper>

            <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 7 }}>
              <Stack spacing={2}>
                <Typography variant="h5">Условия и дополнительные данные</Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  }}
                >
                  <TextField
                    label="Зарплата от"
                    type="number"
                    value={formData.salaryFrom}
                    onChange={(event) => updateField('salaryFrom', event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Зарплата до"
                    type="number"
                    value={formData.salaryTo}
                    onChange={(event) => updateField('salaryTo', event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Теги и технологии"
                    value={formData.tags}
                    onChange={(event) => updateField('tags', event.target.value)}
                    placeholder="React, TypeScript, Python, SQL"
                    fullWidth
                  />
                  <TextField
                    label="Ссылка на изображение"
                    value={formData.mediaUrl}
                    onChange={(event) => updateField('mediaUrl', event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Широта"
                    type="number"
                    value={formData.latitude}
                    onChange={(event) => updateField('latitude', event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Долгота"
                    type="number"
                    value={formData.longitude}
                    onChange={(event) => updateField('longitude', event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Срок действия"
                    type="date"
                    value={formData.expiresAt}
                    onChange={(event) => updateField('expiresAt', event.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    label="Дата события"
                    type="date"
                    value={formData.eventDate}
                    onChange={(event) => updateField('eventDate', event.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isVerifiedOnly}
                      onChange={(event) => updateField('isVerifiedOnly', event.target.checked)}
                    />
                  }
                  label="Показывать только верифицированным соискателям"
                />
              </Stack>
            </Paper>

            <Button type="submit" variant="contained" size="large" disabled={loading || !canCreate}>
              {loading ? 'Публикуем...' : 'Опубликовать карточку'}
            </Button>
          </Stack>

          <Stack spacing={3} sx={{ position: { xl: 'sticky' }, top: { xl: 110 } }}>
            <Paper sx={{ p: 3, borderRadius: 7 }}>
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
                <AutoAwesomeRoundedIcon color="secondary" />
                <Typography variant="h6">Предпросмотр карточки</Typography>
              </Stack>
              <OpportunityCard opportunity={previewOpportunity} />
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 7 }}>
              <Stack spacing={1.5}>
                <Typography variant="h6">Что улучшает карточку</Typography>
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                  <CheckCircleRoundedIcon color="primary" />
                  <Typography color="text.secondary">
                    Кратко объясните ценность позиции и ожидаемый стек в первых двух абзацах.
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                  <CheckCircleRoundedIcon color="primary" />
                  <Typography color="text.secondary">
                    Добавьте координаты, если хотите, чтобы карточка появилась как точка на карте.
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                  <InfoOutlinedIcon color="secondary" />
                  <Typography color="text.secondary">
                    Для удалённого формата достаточно указать город компании или организатора.
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};

export default CreateOpportunityView;
