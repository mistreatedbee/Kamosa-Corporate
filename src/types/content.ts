export interface ServiceLine {
  /** Route slug, e.g. "health-safety-compliance" */
  slug: string;
  number: string;
  title: string;
  shortTitle: string;
  summary: string;
  description: string;
  intro: string;
  capabilities: string[];
  deliverables: {title: string;body: string;}[];
  ctaLabel: string;
  image: string;
  imageAlt: string;
}

export interface Industry {
  name: string;
  description: string;
  image: string;
  imageAlt: string;
  /** Below: used by the dedicated /industries page selector, optional so the existing homepage
   * IndustryGrid (which only needs name/description/image) keeps working unchanged. */
  slug?: string;
  overview?: string;
  servicesRelevant?: string[];
  noConfirmedTrackRecord?: boolean;
  disclosureStatement?: string;
}

export interface ValueItem {
  title: string;
  description: string;
}

export interface MethodologyStage {
  number: string;
  title: string;
  description: string;
}

export interface Credential {
  label: string;
  detail: string;
}

export interface ExperienceRecord {
  sector: string;
  headline: string;
  body: string;
  points: string[];
}

export interface AdditionalService {
  slug: string;
  title: string;
  description: string;
  /** Icon key resolved to a lucide-react component in AdditionalServices.tsx. */
  icon: 'wellness' | 'safecloud' | 'mentoring' | 'sheq';
  ctaLabel: string;
  /** Internal route for the primary CTA (mutually exclusive with externalUrl). */
  to?: string;
  /** External URL for the primary CTA, opened in a new tab (mutually exclusive with `to`). */
  externalUrl?: string;
  /** Only SafeCloud has a secondary CTA (opens the pricing modal). */
  secondaryCtaLabel?: string;
}

export interface SafeCloudPlan {
  name: string;
  employees: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  /** Present for the five fixed-price plans (external registration link). */
  url?: string;
  /** Present only for the Custom plan (mailto link instead of a registration URL). */
  mailto?: string;
  mostPopular?: boolean;
}

export interface SheqConsultingOffer {
  title: string;
  description: string;
  rate: string;
  rateUnit: string;
  cta: string;
  mailto: string;
}