export const POST_STATUSES = [
  "IDEA",
  "DRAFT",
  "NEEDS_REVIEW",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

export const STATUS_LABELS: Record<PostStatus, string> = {
  IDEA: "Idea",
  DRAFT: "Draft",
  NEEDS_REVIEW: "Needs review",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
};

export const STATUS_STYLES: Record<PostStatus, string> = {
  IDEA: "bg-slate-100 text-slate-700 ring-slate-200",
  DRAFT: "bg-amber-100 text-amber-800 ring-amber-200",
  NEEDS_REVIEW: "bg-orange-100 text-orange-800 ring-orange-200",
  APPROVED: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  SCHEDULED: "bg-sky-100 text-sky-800 ring-sky-200",
  PUBLISHED: "bg-violet-100 text-violet-800 ring-violet-200",
};

export const ROLES = ["ADMIN", "EDITOR", "REVIEWER", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  REVIEWER: "Reviewer",
  VIEWER: "Viewer",
};

// Only these roles may move a post into Approved — the review gate exists so the
// person who drafts a post isn't the one clearing it to publish.
const APPROVER_ROLES: Role[] = ["ADMIN", "REVIEWER"];

// Alumni email addresses are personal data belonging to third parties, not
// organizational content. They stay with the roles that actually do outreach, and
// are never selected for list views — see src/app/alumni/page.tsx.
const CONTACT_ROLES: Role[] = ["ADMIN", "EDITOR"];

export function canViewContactInfo(role: Role): boolean {
  return CONTACT_ROLES.includes(role);
}

export function canImportAlumni(role: Role): boolean {
  return CONTACT_ROLES.includes(role);
}

export function nextStatus(status: PostStatus): PostStatus | null {
  const i = POST_STATUSES.indexOf(status);
  return i < POST_STATUSES.length - 1 ? POST_STATUSES[i + 1] : null;
}

export function previousStatus(status: PostStatus): PostStatus | null {
  const i = POST_STATUSES.indexOf(status);
  return i > 0 ? POST_STATUSES[i - 1] : null;
}

export function canTransition(role: Role, to: PostStatus): boolean {
  if (role === "VIEWER") return false;
  if (to === "APPROVED") return APPROVER_ROLES.includes(role);
  return true;
}

export function isPostStatus(value: string): value is PostStatus {
  return (POST_STATUSES as readonly string[]).includes(value);
}

export const PLATFORMS = [
  "INSTAGRAM",
  "FACEBOOK",
  "LINKEDIN",
  "TIKTOK",
  "YOUTUBE",
] as const;

export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
};

export const GRAPHIC_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "READY"] as const;
export type GraphicStatus = (typeof GRAPHIC_STATUSES)[number];

export const GRAPHIC_STATUS_LABELS: Record<GraphicStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  READY: "Ready",
};

export const FEATURED_STATUSES = [
  "NOT_FEATURED",
  "CONSIDERING",
  "FEATURED",
] as const;
export type FeaturedStatus = (typeof FEATURED_STATUSES)[number];

export const FEATURED_STATUS_LABELS: Record<FeaturedStatus, string> = {
  NOT_FEATURED: "Not featured",
  CONSIDERING: "Considering",
  FEATURED: "Featured",
};

export const ASSET_CATEGORIES = [
  "LOGO",
  "PHOTO",
  "VIDEO",
  "CANVA_TEMPLATE",
  "BRAND_GUIDELINE",
  "OTHER",
] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  LOGO: "Logos",
  PHOTO: "Photos",
  VIDEO: "Videos",
  CANVA_TEMPLATE: "Canva templates",
  BRAND_GUIDELINE: "Brand guidelines",
  OTHER: "Other",
};
