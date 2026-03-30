import type { Opportunity } from '../types';

const CITY_COORDINATES: Record<string, [number, number]> = {
  Moscow: [55.751244, 37.618423],
  MoscowCity: [55.751244, 37.618423],
  SaintPetersburg: [59.93428, 30.335099],
  Kazan: [55.796127, 49.106414],
  Yekaterinburg: [56.838926, 60.605703],
  Novosibirsk: [55.008353, 82.935733],
  Innopolis: [55.75222, 48.74411],
  Perm: [58.010455, 56.229443],
  Samara: [53.195878, 50.100202],
  NizhnyNovgorod: [56.296503, 43.936059],
  Ufa: [54.738762, 55.972055],
  Tomsk: [56.48458, 84.948158],
  Omsk: [54.98848, 73.324236],
  Chelyabinsk: [55.164442, 61.436843],
  Krasnodar: [45.03547, 38.975313],
};

const normalizeCity = (value?: string) =>
  (value ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '');

export const getCityCoordinates = (city?: string) => {
  const normalized = normalizeCity(city);
  if (!normalized) {
    return null;
  }

  return CITY_COORDINATES[normalized] ?? null;
};

export const getOpportunityCoordinates = (opportunity: Opportunity) => {
  if (typeof opportunity.latitude === 'number' && typeof opportunity.longitude === 'number') {
    return [opportunity.latitude, opportunity.longitude] as [number, number];
  }

  return getCityCoordinates(opportunity.city);
};
