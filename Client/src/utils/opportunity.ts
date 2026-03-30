import type { ApplicationStatus, Opportunity, OpportunityStatus, OpportunityType, WorkFormat } from '../types';

export const opportunityTypeLabels: Record<OpportunityType, string> = {
  Vacancy: 'Вакансия',
  Internship: 'Стажировка',
  Mentorship: 'Менторская программа',
  Event: 'Карьерное событие',
};

export const workFormatLabels: Record<WorkFormat, string> = {
  Office: 'Офис',
  Hybrid: 'Гибрид',
  Remote: 'Удалённо',
};

export const opportunityStatusLabels: Record<OpportunityStatus, string> = {
  Draft: 'Черновик',
  Planned: 'Запланировано',
  OnModeration: 'На модерации',
  Active: 'Активно',
  Archived: 'В архиве',
  Closed: 'Закрыто',
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  Pending: 'На рассмотрении',
  Accepted: 'Принят',
  Rejected: 'Отклонён',
  Reserved: 'В резерве',
};

export const splitTags = (tags?: string) =>
  (tags ?? '')
    .split(/[;,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

export const formatSalary = (salaryFrom?: number, salaryTo?: number) => {
  const formatter = new Intl.NumberFormat('ru-RU');

  if (salaryFrom && salaryTo) {
    return `${formatter.format(salaryFrom)} - ${formatter.format(salaryTo)} ₽`;
  }

  if (salaryFrom) {
    return `от ${formatter.format(salaryFrom)} ₽`;
  }

  if (salaryTo) {
    return `до ${formatter.format(salaryTo)} ₽`;
  }

  return 'По договорённости';
};

export const formatDate = (date?: string, options?: Intl.DateTimeFormatOptions) => {
  if (!date) {
    return 'Не указано';
  }

  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...options,
  });
};

export const formatShortDate = (date?: string) =>
  formatDate(date, {
    month: 'short',
    year: undefined,
  });

export const formatOpportunityType = (type: OpportunityType) => opportunityTypeLabels[type] ?? type;

export const formatWorkFormat = (workFormat: WorkFormat) => workFormatLabels[workFormat] ?? workFormat;

export const formatOpportunityStatus = (status: OpportunityStatus) =>
  opportunityStatusLabels[status] ?? status;

export const formatApplicationStatus = (status: ApplicationStatus) =>
  applicationStatusLabels[status] ?? status;

export const getOpportunityTone = (type: OpportunityType) => {
  switch (type) {
    case 'Internship':
      return {
        markerClassName: 'marker-internship',
        accent: '#0f766e',
        surface: 'rgba(15, 118, 110, 0.12)',
        text: '#0f766e',
      };
    case 'Mentorship':
      return {
        markerClassName: 'marker-mentorship',
        accent: '#7c3aed',
        surface: 'rgba(124, 58, 237, 0.12)',
        text: '#6d28d9',
      };
    case 'Event':
      return {
        markerClassName: 'marker-event',
        accent: '#ea580c',
        surface: 'rgba(234, 88, 12, 0.12)',
        text: '#c2410c',
      };
    case 'Vacancy':
    default:
      return {
        markerClassName: 'marker-vacancy',
        accent: '#0284c7',
        surface: 'rgba(2, 132, 199, 0.12)',
        text: '#0369a1',
      };
  }
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
