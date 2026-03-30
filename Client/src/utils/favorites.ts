const FAVORITES_KEY = 'trampolin.favoriteOpportunityIds';
const FAVORITE_COMPANIES_KEY = 'trampolin.favoriteEmployerIds';
export const FAVORITES_UPDATED_EVENT = 'trampolin:favorites-updated';

const canUseStorage = typeof window !== 'undefined';

const readList = (): string[] => {
  if (!canUseStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const writeList = (ids: string[]) => {
  if (!canUseStorage) {
    return;
  }

  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
};

export const getFavoriteOpportunityIds = () => readList();

const readCompanyList = (): string[] => {
  if (!canUseStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FAVORITE_COMPANIES_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const writeCompanyList = (ids: string[]) => {
  if (!canUseStorage) {
    return;
  }

  window.localStorage.setItem(FAVORITE_COMPANIES_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
};

export const getFavoriteEmployerIds = () => readCompanyList();

export const isOpportunityFavorite = (opportunityId: string) => readList().includes(opportunityId);
export const isEmployerFavorite = (employerId: string) => readCompanyList().includes(employerId);

export const toggleFavoriteOpportunity = (opportunityId: string) => {
  const current = readList();
  const next = current.includes(opportunityId)
    ? current.filter((id) => id !== opportunityId)
    : [...current, opportunityId];

  writeList(next);

  return next;
};

export const toggleFavoriteEmployer = (employerId: string) => {
  const current = readCompanyList();
  const next = current.includes(employerId)
    ? current.filter((id) => id !== employerId)
    : [...current, employerId];

  writeCompanyList(next);

  return next;
};
