import type {
  ApplicationStatus,
  EmployerVerificationStatus,
  Opportunity,
  OpportunityStatus,
  OpportunityType,
  WorkFormat,
} from '../types';

export const opportunityTypeLabel: Record<OpportunityType, string> = {
  Vacancy: 'Вакансия',
  Internship: 'Стажировка',
  Mentorship: 'Менторство',
  Event: 'Событие',
};

export const workFormatLabel: Record<WorkFormat, string> = {
  Office: 'Офис',
  Hybrid: 'Гибрид',
  Remote: 'Удаленно',
};

export const opportunityStatusLabel: Record<OpportunityStatus, string> = {
  Draft: 'Черновик',
  Planned: 'Запланировано',
  OnModeration: 'На модерации',
  Active: 'Активно',
  Closed: 'Закрыто',
  Archived: 'В архиве',
};

export const applicationStatusLabel: Record<ApplicationStatus, string> = {
  Pending: 'На рассмотрении',
  Accepted: 'Принят',
  Rejected: 'Отклонен',
  Reserved: 'В резерве',
};

export const verificationStatusLabel: Record<EmployerVerificationStatus, string> = {
  Pending: 'Ожидает проверки',
  Verified: 'Верифицирован',
  Rejected: 'Отклонен',
  RequiresInfo: 'Нужны уточнения',
};

export const splitTags = (value?: string) =>
  (value ?? '')
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);

export const formatMoney = (from?: number | null, to?: number | null) => {
  const formatter = new Intl.NumberFormat('ru-RU');

  if (from && to) {
    return `${formatter.format(from)} - ${formatter.format(to)} ₽`;
  }

  if (from) {
    return `от ${formatter.format(from)} ₽`;
  }

  if (to) {
    return `до ${formatter.format(to)} ₽`;
  }

  return 'По договоренности';
};

export const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Не указано';
  }

  return new Date(value).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export const getOpportunityLocation = (opportunity: Opportunity) =>
  opportunity.address ? `${opportunity.city}, ${opportunity.address}` : opportunity.city;

export const getOpportunityTimeline = (opportunity: Opportunity) => {
  if (opportunity.eventDate) {
    return `Дата события: ${formatDate(opportunity.eventDate)}`;
  }

  if (opportunity.expiresAt) {
    return `Отклики до ${formatDate(opportunity.expiresAt)}`;
  }

  return `Опубликовано ${formatDate(opportunity.publishedAt)}`;
};

export const getStatusColor = (status: OpportunityStatus) => {
  switch (status) {
    case 'Active':
      return 'success';
    case 'OnModeration':
      return 'warning';
    case 'Closed':
      return 'default';
    case 'Draft':
      return 'default';
    case 'Planned':
      return 'info';
    case 'Archived':
      return 'default';
    default:
      return 'default';
  }
};

export const getApplicationColor = (status: ApplicationStatus) => {
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

export const getOpportunityAccent = (type: OpportunityType) => {
  switch (type) {
    case 'Internship':
      return { color: '#0f766e', surface: 'rgba(15, 118, 110, 0.12)', markerClassName: 'marker-internship' };
    case 'Mentorship':
      return { color: '#7c3aed', surface: 'rgba(124, 58, 237, 0.12)', markerClassName: 'marker-mentorship' };
    case 'Event':
      return { color: '#ea580c', surface: 'rgba(234, 88, 12, 0.12)', markerClassName: 'marker-event' };
    case 'Vacancy':
    default:
      return { color: '#0284c7', surface: 'rgba(2, 132, 199, 0.12)', markerClassName: 'marker-vacancy' };
  }
};
