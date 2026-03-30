import axios from 'axios';
import type {
  ApplicantProfile,
  Application,
  ApplicationStatus,
  Contact,
  ContactStatus,
  CuratorProfile,
  EmployerProfile,
  EmployerVerificationStatus,
  Favorite,
  FavoriteType,
  LoginDto,
  Opportunity,
  OpportunityFilters,
  OpportunityStatus,
  PlatformTag,
  RecommendedFeedResponse,
  Recommendation,
  RegisterDto,
  Role,
  TagCategory,
} from '../types';

const API_BASE_URL = 'http://localhost:5191/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (dto: LoginDto) => {
    const response = await api.post('/auth/login', dto);
    return response.data as { token: string; user: { id: string; displayName: string; email: string; roles: Role[] } };
  },
  register: async (dto: RegisterDto) => {
    const response = await api.post('/auth/register', dto);
    return response.data;
  },
};

export const opportunityService = {
  getAll: async (params?: OpportunityFilters) => {
    const response = await api.get('/opportunity', { params });
    return response.data as Opportunity[];
  },
  getById: async (id: string) => {
    const response = await api.get(`/opportunity/${id}`);
    return response.data as Opportunity;
  },
  getMy: async () => {
    const response = await api.get('/opportunity/my');
    return response.data as Opportunity[];
  },
  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/opportunity', data);
    return response.data as { id: string; status: OpportunityStatus; message: string };
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const response = await api.put(`/opportunity/${id}`, data);
    return response.data as { status: OpportunityStatus; message: string };
  },
  delete: async (id: string) => {
    const response = await api.delete(`/opportunity/${id}`);
    return response.data;
  },
};

export const applicationService = {
  create: async (data: { opportunityId: string; message?: string }) => {
    const response = await api.post('/application', data);
    return response.data;
  },
  getMy: async () => {
    const response = await api.get('/application/my');
    return response.data as Application[];
  },
  getForMyOpportunities: async () => {
    const response = await api.get('/application/for-my-opportunities');
    return response.data as Application[];
  },
  updateStatus: async (id: string, status: ApplicationStatus) => {
    const response = await api.put(`/application/${id}/status`, { status });
    return response.data;
  },
};

export const profileService = {
  getApplicantProfile: async () => {
    const response = await api.get('/applicantprofile/me');
    return response.data as ApplicantProfile;
  },
  getApplicantById: async (id: string) => {
    const response = await api.get(`/applicantprofile/${id}`);
    return response.data as ApplicantProfile;
  },
  getApplicantDirectory: async () => {
    const response = await api.get('/applicantprofile');
    return response.data as ApplicantProfile[];
  },
  createApplicantProfile: async (data: Record<string, unknown>) => {
    const response = await api.post('/applicantprofile', data);
    return response.data as ApplicantProfile;
  },
  updateApplicantProfile: async (data: Record<string, unknown>) => {
    const response = await api.put('/applicantprofile/me', data);
    return response.data as ApplicantProfile;
  },
  updateApplicantProfileByCurator: async (id: string, data: Record<string, unknown>) => {
    const response = await api.put(`/applicantprofile/${id}`, data);
    return response.data as ApplicantProfile;
  },
  getEmployerProfile: async () => {
    const response = await api.get('/employerprofile/me');
    return response.data as EmployerProfile;
  },
  getEmployerById: async (id: string) => {
    const response = await api.get(`/employerprofile/${id}`);
    return response.data as EmployerProfile;
  },
  getEmployerDirectory: async () => {
    const response = await api.get('/employerprofile');
    return response.data as EmployerProfile[];
  },
  createEmployerProfile: async (data: Record<string, unknown>) => {
    const response = await api.post('/employerprofile', data);
    return response.data as EmployerProfile;
  },
  updateEmployerProfile: async (data: Record<string, unknown>) => {
    const response = await api.put('/employerprofile/me', data);
    return response.data as EmployerProfile;
  },
  updateEmployerProfileByCurator: async (id: string, data: Record<string, unknown>) => {
    const response = await api.put(`/employerprofile/${id}`, data);
    return response.data as EmployerProfile;
  },
};

export const favoritesService = {
  getMy: async () => {
    const response = await api.get('/favorites/my');
    return response.data as Favorite[];
  },
  create: async (data: { type: FavoriteType; opportunityId?: string; employerProfileId?: string }) => {
    const response = await api.post('/favorites', data);
    return response.data as Favorite;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/favorites/${id}`);
    return response.data;
  },
};

export const contactsService = {
  getMy: async () => {
    const response = await api.get('/contacts/my');
    return response.data as Contact[];
  },
  create: async (data: { receiverApplicantProfileId: string; message?: string }) => {
    const response = await api.post('/contacts', data);
    return response.data as Contact;
  },
  updateStatus: async (id: string, status: ContactStatus) => {
    const response = await api.put(`/contacts/${id}/status`, { status });
    return response.data as Contact;
  },
};

export const recommendationsService = {
  getMy: async () => {
    const response = await api.get('/recommendations/my');
    return response.data as Recommendation[];
  },
  getFeed: async (topN = 10) => {
    const response = await api.get('/recommendation/feed', { params: { topN } });
    return response.data as RecommendedFeedResponse;
  },
  create: async (data: { recommendedApplicantProfileId: string; opportunityId: string; message?: string }) => {
    const response = await api.post('/recommendations', data);
    return response.data;
  },
};

export const tagsService = {
  getAll: async (params?: { category?: TagCategory; search?: string }) => {
    const response = await api.get('/platformtags', { params });
    return response.data as PlatformTag[];
  },
  create: async (data: { name: string; category: TagCategory }) => {
    const response = await api.post('/platformtags', data);
    return response.data as PlatformTag;
  },
};

export const moderationService = {
  getEmployers: async (params?: { status?: EmployerVerificationStatus }) => {
    const response = await api.get('/moderation/employers', { params });
    return response.data as EmployerProfile[];
  },
  updateEmployerVerification: async (id: string, data: { status: EmployerVerificationStatus; comment?: string }) => {
    const response = await api.put(`/moderation/employers/${id}/verification`, data);
    return response.data;
  },
  getOpportunities: async (params?: { status?: OpportunityStatus }) => {
    const response = await api.get('/moderation/opportunities', { params });
    return response.data as Opportunity[];
  },
  updateOpportunity: async (id: string, data: { status: OpportunityStatus; moderationComment?: string }) => {
    const response = await api.put(`/moderation/opportunities/${id}`, data);
    return response.data;
  },
};

export const curatorService = {
  getAll: async () => {
    const response = await api.get('/curators');
    return response.data as CuratorProfile[];
  },
  create: async (data: {
    fullName: string;
    email: string;
    password: string;
    organizationName: string;
    position: string;
    isAdmin?: boolean;
  }) => {
    const response = await api.post('/curators', data);
    return response.data;
  },
};

export default api;
