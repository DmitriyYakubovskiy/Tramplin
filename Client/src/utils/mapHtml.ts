import type { Opportunity } from '../types';
import { formatMoney, getOpportunityLocation } from './presentation';

export const escapeHtml = (value?: string | null) =>
  (value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const buildOpportunityMapHintHtml = (opportunity: Opportunity) => {
  const salary = escapeHtml(formatMoney(opportunity.salaryFrom, opportunity.salaryTo));
  const location = escapeHtml(getOpportunityLocation(opportunity));

  return `
    <div class="tr-ymap-card">
      <div class="tr-ymap-card__title">${escapeHtml(opportunity.title)}</div>
      <div class="tr-ymap-card__meta">${escapeHtml(opportunity.companyName)}</div>
      <div class="tr-ymap-card__meta">${location}</div>
      <div class="tr-ymap-card__salary">${salary}</div>
    </div>
  `;
};

export const buildOpportunityMapBalloonHtml = (opportunity: Opportunity) => {
  const tags = escapeHtml(opportunity.tags);

  return `
    <div class="tr-ymap-card tr-ymap-card--balloon">
      <div class="tr-ymap-card__title">${escapeHtml(opportunity.title)}</div>
      <div class="tr-ymap-card__meta">${escapeHtml(opportunity.companyName)}</div>
      <div class="tr-ymap-card__meta">${escapeHtml(getOpportunityLocation(opportunity))}</div>
      <div class="tr-ymap-card__salary">${escapeHtml(formatMoney(opportunity.salaryFrom, opportunity.salaryTo))}</div>
      ${tags ? `<div class="tr-ymap-card__tags">${tags}</div>` : ''}
      <a class="tr-ymap-card__link" href="/opportunity/${opportunity.id}">Открыть карточку</a>
    </div>
  `;
};
