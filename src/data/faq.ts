export interface FaqItem {
  id: string;
  category: 'General' | 'Health & Safety' | 'Consulting' | 'Procurement' | 'Training' | 'Environmental' | 'Tenders';
  question: string;
  answer: string;
}

// Sourced verbatim from docs/CONTENT_MAPPING.md Part 4 — every answer traces directly to
// docs/KAMOSA_COMPANY_PROFILE.md. Anything the profile doesn't confirm (address, turnaround times,
// additional procurement categories) is marked "Information to be confirmed" rather than guessed.
export const faqItems: FaqItem[] = [
{
  id: 'what-does-kamosa-do',
  category: 'General',
  question: 'What does Kamosa (Pty) Ltd do?',
  answer:
  'Kamosa is an integrated business solutions company offering four core service lines: Health, Safety & Compliance; Business Consulting; Procurement & Supply; and Training & Skills Development — plus Environmental Management delivered via an associate network. Kamosa works with organisations in mining, construction, energy, manufacturing, transport, government, and commercial sectors.'
},
{
  id: 'is-kamosa-registered',
  category: 'General',
  question: 'Is Kamosa a registered company?',
  answer:
  'Yes. Kamosa (Pty) Ltd is a registered South African private company (Registration Number 2023/164644/07), an active Central Supplier Database (CSD) supplier (CSD Number MAAA1465904), and a Level 1 B-BBEE Contributor offering 135% procurement recognition. Kamosa is 100% Black Female Owned.'
},
{
  id: 'where-is-kamosa-based',
  category: 'General',
  question: 'Where is Kamosa based, and can I visit your office?',
  answer:
  'Information to be confirmed with Kamosa directly. Kamosa operates within the Republic of South Africa; a physical/postal address has not yet been confirmed for publication.'
},
{
  id: 'how-to-contact-kamosa',
  category: 'General',
  question: 'How do I get in touch with Kamosa?',
  answer: 'You can contact the Managing Director, Lovedonia Mmola, on 071 191 4744 or via info@kamosa.co.za.'
},
{
  id: 'health-safety-services',
  category: 'Health & Safety',
  question: 'What health and safety services does Kamosa offer?',
  answer:
  'Construction health and safety file development and management, Fall Protection Plan development, Hazard Identification and Risk Assessments (HIRA) and baseline risk assessments, legal compliance audits and legal appointment registers, incident investigation and reporting, emergency preparedness and response planning, and SHE management plans and tender safety documentation packs.'
},
{
  id: 'health-safety-qualified',
  category: 'Health & Safety',
  question: "Is Kamosa's health and safety work led by a qualified professional?",
  answer:
  'Yes. Kamosa is led by a SACPCMP-registered Construction Health and Safety Manager (South African Council for the Project and Construction Management Professions) who is also a member of the South African Institute of Occupational Safety and Health (SAIOSH), holds an Advanced Diploma and National Diploma in Safety Management, is a Certified Fall Protection Plan Developer, and holds First Aid Level 3.'
},
{
  id: 'mining-and-construction',
  category: 'Health & Safety',
  question: 'Does Kamosa work on mining sites as well as construction sites?',
  answer:
  'Yes. Kamosa has hands-on experience across mining (including coal handling and hang-up removal projects) and construction (SHE management plans, HIRA, and tender safety documentation packs), in addition to energy, manufacturing, and transport environments.'
},
{
  id: 'consulting-services',
  category: 'Consulting',
  question: 'What kind of business consulting does Kamosa provide?',
  answer:
  'Management systems development and documentation (ISO-aligned), policy and procedure development, operational risk management and internal auditing, and contractor management and compliance support.'
},
{
  id: 'procurement-products',
  category: 'Procurement',
  question: 'What products can Kamosa supply?',
  answer:
  'Personal Protective Equipment (PPE), construction tools and consumables, and safety signage and related site materials. Kamosa is CSD-registered (MAAA1465904), which supports public-sector procurement processes.'
},
{
  id: 'procurement-other-categories',
  category: 'Procurement',
  question: 'Can Kamosa supply products outside of PPE, tools, and signage?',
  answer:
  "Information to be confirmed with Kamosa directly. At present, Kamosa's confirmed procurement categories are limited to PPE, construction tools and consumables, and safety signage."
},
{
  id: 'training-offered',
  category: 'Training',
  question: 'What training does Kamosa offer, and is it accredited?',
  answer:
  'Kamosa delivers accredited-standard training in occupational health and safety awareness, HAZCHEM, safe stacking & storage, hazardous chemical agents, first aid, and legal liability. Training is delivered by a registered assessor, moderator, and facilitator, and includes learner guides, assessments, and marking memoranda developed for workforces with varying literacy levels.'
},
{
  id: 'environmental-in-house',
  category: 'Environmental',
  question: 'Does Kamosa have an in-house environmental team?',
  answer:
  'No. Environmental Management is delivered through an associate network, not as an in-house Kamosa capability. This is provided through a practising Environmental Assessment Practitioner with a background at the South African National Biodiversity Institute (SANBI), covering environmental compliance under NEMA and NEMBA, EIA support, invasive alien species management, biodiversity conservation, and community stakeholder engagement.'
},
{
  id: 'tender-documentation',
  category: 'Tenders',
  question: 'Can Kamosa assist with tender documentation?',
  answer:
  'Yes, within Health, Safety & Compliance — Kamosa prepares SHE management plans and full tender safety documentation packs. Information on turnaround times for tender submissions is to be confirmed with Kamosa directly.'
}];


export const faqCategories: FaqItem['category'][] = [
'General',
'Health & Safety',
'Consulting',
'Procurement',
'Training',
'Environmental',
'Tenders'];
