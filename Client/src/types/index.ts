export type Role = 'Applicant' | 'Employer' | 'Curator' | 'Admin';
export type OpportunityType = 'Vacancy' | 'Internship' | 'Mentorship' | 'Event';
export type WorkFormat = 'Office' | 'Hybrid' | 'Remote';
export type OpportunityStatus = 'Draft' | 'Planned' | 'OnModeration' | 'Active' | 'Closed' | 'Archived';
export type ApplicationStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Reserved';
export type FavoriteType = 'Opportunity' | 'Employer';
export type ContactStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Blocked';
export type EmployerVerificationStatus = 'Pending' | 'Verified' | 'Rejected' | 'RequiresInfo';
export type TagCategory = 'Technology' | 'Level' | 'EmploymentType' | 'Direction' | 'Other';

export interface User {
  id: string;
  displayName: string;
  email: string;
  roles: Role[];
}

export interface EmployerSummary {
  id: string;
  companyName: string;
  description?: string;
  industry?: string;
  websiteUrl?: string;
  socialLinks?: string;
  logoUrl?: string;
  videoPresentationUrl?: string;
  city?: string;
  officeAddress?: string;
  isVerified: boolean;
  verificationStatus?: EmployerVerificationStatus | null;
  user?: {
    id: string;
    displayName: string;
    email?: string | null;
  };
}

export interface Opportunity {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription?: string;
  type: OpportunityType;
  workFormat: WorkFormat;
  status: OpportunityStatus;
  companyName: string;
  city: string;
  address?: string;
  salaryFrom?: number | null;
  salaryTo?: number | null;
  contactEmail: string;
  contactPhone?: string;
  externalUrl?: string;
  tags: string;
  mediaUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
  publishedAt: string;
  expiresAt?: string | null;
  eventDate?: string | null;
  isVerifiedOnly: boolean;
  moderationComment?: string | null;
  employer?: EmployerSummary | null;
}

export interface ApplicationApplicant {
  id: string;
  fullName: string;
  university: string;
  faculty: string;
  courseOrGraduationYear: string;
  city: string;
  gitHubUrl?: string;
  portfolioUrl?: string;
  careerInterests?: string;
  resumeFileUrl?: string | null;
  contactEmail?: string | null;
}

export interface Application {
  id: string;
  message?: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt?: string;
  opportunity: Opportunity;
  applicant?: ApplicationApplicant | null;
}

export interface ApplicantProfileApplication {
  id: string;
  status: ApplicationStatus;
  message?: string;
  createdAt: string;
  updatedAt?: string;
  opportunity?: Pick<Opportunity, 'id' | 'title' | 'type' | 'companyName' | 'city' | 'status'> | null;
}

export interface ApplicantProfile {
  id: string;
  userId: string;
  fullName: string;
  university: string;
  faculty: string;
  courseOrGraduationYear: string;
  about: string;
  careerInterests: string;
  skills: string;
  projectExperience: string;
  portfolioUrl?: string;
  gitHubUrl?: string;
  resumeFileUrl?: string | null;
  city: string;
  isOpenToWork: boolean;
  isProfilePublic: boolean;
  showEmail?: boolean | null;
  showPhone?: boolean | null;
  showContactsOnlyForVerifiedEmployers?: boolean | null;
  showResumeToAuthenticatedUsers?: boolean | null;
  showApplicationsToApplicants?: boolean | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  applications?: ApplicantProfileApplication[] | null;
  createdAt: string;
  user?: {
    id: string;
    displayName: string;
  } | null;
}

export interface EmployerProfile extends EmployerSummary {
  userId: string;
  verificationMethod?: string;
  verificationData?: string;
  verificationComment?: string;
  verifiedAt?: string | null;
  createdAt: string;
}

export interface Favorite {
  id: string;
  type: FavoriteType;
  createdAt: string;
  opportunity?: Pick<Opportunity, 'id' | 'title' | 'companyName' | 'city' | 'type' | 'status'> | null;
  employer?: EmployerSummary | null;
}

export interface ContactPeer {
  id: string;
  fullName: string;
  university: string;
  courseOrGraduationYear: string;
  city: string;
  careerInterests?: string;
  user?: {
    id: string;
    displayName: string;
  } | null;
}

export interface Contact {
  id: string;
  message?: string;
  status: ContactStatus;
  createdAt: string;
  isIncoming: boolean;
  peer?: ContactPeer | null;
}

export interface Recommendation {
  id: string;
  message?: string;
  createdAt: string;
  isIncoming: boolean;
  opportunity?: Pick<Opportunity, 'id' | 'title' | 'companyName' | 'city' | 'status'> | null;
  recommender?: { id: string; fullName: string } | null;
  recommended?: { id: string; fullName: string } | null;
}

export interface RecommendedFeedItem
  extends Pick<
    Opportunity,
    | 'id'
    | 'title'
    | 'shortDescription'
    | 'type'
    | 'workFormat'
    | 'status'
    | 'companyName'
    | 'city'
    | 'salaryFrom'
    | 'salaryTo'
    | 'tags'
    | 'publishedAt'
    | 'expiresAt'
    | 'isVerifiedOnly'
  > {
  employer?: {
    id: string;
    companyName: string;
    logoUrl?: string;
    isVerified: boolean;
  } | null;
}

export interface RecommendedFeedResponse {
  items: RecommendedFeedItem[];
  message?: string;
}

export interface PlatformTag {
  id: string;
  name: string;
  category: TagCategory;
  isSystem: boolean;
  createdByUserId?: string | null;
  createdAt: string;
}

export interface CuratorProfile {
  id: string;
  fullName: string;
  organizationName: string;
  position: string;
  isAdmin: boolean;
  createdAt: string;
  user?: {
    id: string;
    displayName: string;
    email?: string;
  } | null;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
  role: 'Applicant' | 'Employer';
}

export interface OpportunityFilters {
  type?: OpportunityType;
  city?: string;
  status?: OpportunityStatus;
  search?: string;
  workFormat?: WorkFormat;
  salaryFrom?: number;
  salaryTo?: number;
  tag?: string;
}
