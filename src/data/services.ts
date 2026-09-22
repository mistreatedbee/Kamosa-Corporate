import type { ServiceLine } from '../types/content';

export const services: ServiceLine[] = [
{
  slug: 'health-safety-compliance',
  number: '01',
  title: 'Health, Safety & Compliance',
  shortTitle: 'Health & Safety',
  summary:
  'Our core discipline. Occupational health and safety systems that satisfy the OHS Act, the Construction Regulations and Mine Health and Safety requirements.',
  description:
  'Our core discipline. We help organisations build, implement, and maintain occupational health and safety systems that satisfy the OHS Act, the Construction Regulations, and Mine Health and Safety requirements.',
  intro:
  'Compliance is only useful when it works on site. We develop documentation, risk assessments and management systems that hold up to scrutiny from clients, principal contractors and inspectors — and that the people doing the work can actually follow.',
  capabilities: [
  'Construction health and safety file development and management',
  'Fall Protection Plan development',
  'Hazard Identification and Risk Assessments',
  'Baseline risk assessments',
  'Legal compliance audits',
  'Legal appointment registers',
  'Incident investigation and reporting',
  'Emergency preparedness and response planning',
  'SHE management plans',
  'Tender safety documentation'],

  deliverables: [
  {
    title: 'Health and safety files',
    body: 'Structured, auditable files compiled and maintained for the duration of a project, aligned to the Construction Regulations.'
  },
  {
    title: 'Risk assessment programmes',
    body: 'Baseline and issue-based HIRA, task-based assessments and the controls, training and monitoring that follow from them.'
  },
  {
    title: 'Compliance auditing',
    body: 'Legal compliance audits against applicable legislation, with clear findings, priorities and corrective action plans.'
  },
  {
    title: 'Tender safety documentation',
    body: 'Safety submissions prepared to the standard expected by procurement and tender evaluation panels.'
  }],

  ctaLabel: 'Explore Health & Safety',
  image: "/d88a7876-ba83-4c30-b30d-f9cb4387d34e.jpg",
  imageAlt:
  'Health and safety professional in a hard hat and high-visibility vest completing a compliance checklist on an industrial walkway'
},
{
  slug: 'business-consulting',
  number: '02',
  title: 'Business Consulting',
  shortTitle: 'Business Consulting',
  summary:
  'Practical advisory support that helps organisations strengthen systems, manage risk and improve operational performance.',
  description:
  'Practical advisory support that helps organisations strengthen systems, manage risk, and improve operational performance.',
  intro:
  'We work alongside management teams to put structure behind day-to-day operations: documented systems, clear procedures and internal controls that make performance measurable rather than assumed.',
  capabilities: [
  'Management systems development',
  'ISO-aligned documentation',
  'Policy development',
  'Procedure development',
  'Operational risk management',
  'Internal auditing',
  'Contractor management',
  'Compliance support'],

  deliverables: [
  {
    title: 'Management systems',
    body: 'System architecture, documentation hierarchies and records that support ISO-aligned ways of working.'
  },
  {
    title: 'Policies and procedures',
    body: 'Policy and procedure sets written for the organisation in front of us, not generic templates.'
  },
  {
    title: 'Internal audit support',
    body: 'Independent internal auditing with findings tracked through to closure.'
  },
  {
    title: 'Contractor management',
    body: 'Pre-qualification, onboarding and ongoing oversight frameworks for contractors and suppliers.'
  }],

  ctaLabel: 'Explore Business Consulting',
  image: "/6928b7ab-9299-4e7b-acb4-97116f4c86bf.jpg",
  imageAlt: 'Professionals reviewing technical management system documentation together in a site office'
},
{
  slug: 'procurement-supply',
  number: '03',
  title: 'Procurement & Supply',
  shortTitle: 'Procurement & Supply',
  summary: 'Reliable supply of safety-related goods to keep workplaces compliant and operational.',
  description: 'Reliable supply of safety-related goods to keep workplaces compliant and operational.',
  intro:
  'Compliance depends on the right equipment being on site when it is needed. We supply safety-related goods and consumables to support operational continuity.',
  capabilities: [
  'PPE supply',
  'Construction tools',
  'Consumables',
  'Safety signage',
  'Related site materials'],

  deliverables: [
  {
    title: 'Personal protective equipment',
    body: 'PPE supplied to match the hazards identified in your risk assessments.'
  },
  {
    title: 'Tools and consumables',
    body: 'Construction tools, consumables and related site materials.'
  },
  {
    title: 'Safety signage',
    body: 'Statutory and site-specific signage to support compliant work areas.'
  },
  {
    title: 'CSD registered supplier',
    body: `Registered on the Central Supplier Database under ${'MAAA1465904'} for public-sector procurement.`
  }],

  ctaLabel: 'Explore Procurement',
  image: "/3dbe6dd2-e117-42b2-b5fc-7ea49599991b.jpg",
  imageAlt: 'Driver completing a pre-trip vehicle defect inspection at a freight depot'
},
{
  slug: 'training-skills-development',
  number: '04',
  title: 'Training & Skills Development',
  shortTitle: 'Training & Skills',
  summary: 'Accredited-standard training delivered by a registered assessor, moderator and facilitator.',
  description: 'Accredited-standard training delivered by a registered assessor, moderator and facilitator.',
  intro:
  'Training is where a safety system either becomes real or stays on paper. Our programmes are delivered to accredited standards and supported by proper learner material, assessment and moderation.',
  capabilities: [
  'Occupational health and safety awareness',
  'HAZCHEM',
  'Safe stacking & storage',
  'Hazardous chemical agents',
  'First aid',
  'Legal liability training',
  'Learner guides',
  'Assessments',
  'Marking memoranda'],

  deliverables: [
  {
    title: 'Facilitated training',
    body: 'Programmes delivered on site or at a venue of your choosing, tailored to the risks of the operation.'
  },
  {
    title: 'Learner material',
    body: 'Learner guides, workbooks and supporting material developed to accredited standards.'
  },
  {
    title: 'Assessment and moderation',
    body: 'Assessments and marking memoranda administered by a registered assessor and moderator.'
  },
  {
    title: 'Legal liability',
    body: 'Legal liability training for supervisors, managers and appointed persons.'
  }],

  ctaLabel: 'Explore Training',
  image: "/acf12e62-ec05-4568-869e-6ed018b4ca75.jpg",
  imageAlt: 'Facilitator presenting an occupational health and safety training session to learners in reflective vests'
}];


export const serviceOptions = [
'Health, Safety & Compliance',
'Business Consulting',
'Procurement & Supply',
'Training & Skills Development',
'Environmental Management',
'General Enquiry'];

/** Slug + label pairs for forms that need to store a service_slug (request-service, request-a-quote). */
export const serviceSlugOptions: { slug: string; label: string }[] = [
{ slug: 'health-safety-compliance', label: 'Health, Safety & Compliance' },
{ slug: 'business-consulting', label: 'Business Consulting' },
{ slug: 'procurement-supply', label: 'Procurement & Supply' },
{ slug: 'training-skills-development', label: 'Training & Skills Development' },
{ slug: 'environmental', label: 'Environmental Management' }];