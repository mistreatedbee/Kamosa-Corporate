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