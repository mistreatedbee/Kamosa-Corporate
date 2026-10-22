// Suggestion lists for <datalist>-backed inputs across the site's forms — real clickable options
// someone can pick from, not just grey placeholder text that vanishes on focus. A datalist still
// lets the visitor type something else entirely (these are real-world fields with too much
// variety to force into a closed dropdown), but shows common answers as a suggestion list the
// moment they click in.

export const SA_LOCATIONS = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Mpumalanga',
  'Limpopo',
  'North West',
  'Northern Cape',
  'Johannesburg',
  'Pretoria',
  'Cape Town',
  'Durban',
  'Rustenburg',
  'Polokwane'
];

export const SITE_TYPES = [
  'Underground mine',
  'Open-pit mine',
  'Construction site',
  'Warehouse',
  'Manufacturing plant',
  'Logistics yard',
  'Office premises'
];

export const PROJECT_DURATIONS = ['1 month', '3 months', '6 months', '12 months', 'Ongoing'];

export const SAFETY_DOCUMENTS = [
  'Safety file',
  'HIRA',
  'Fall Protection Plan',
  'Tender pack',
  'Legal appointment register',
  'Emergency plan'
];

export const COMPLIANCE_STATUSES = [
  'No formal safety file yet',
  'Partial compliance',
  'Fully compliant, needs review',
  'Preparing for audit'
];

export const TRAINING_COURSES = [
  'SAMTRAC',
  'First Aid Level 1',
  'First Aid Level 2',
  'First Aid Level 3',
  'HIRA',
  'Fire Fighting',
  'Working at Heights',
  'Confined Space Entry',
  'SHE Representative'
];

export const ORGANISATION_TYPES = [
  'Mining contractor',
  'Construction company',
  'Logistics company',
  'Manufacturing company',
  'Government entity'
];

export const PROCUREMENT_CATEGORIES = ['PPE', 'Tools & consumables', 'Safety signage', 'First aid supplies'];

export const JOB_CATEGORIES = [
  'Health & Safety',
  'Business Consulting',
  'Procurement & Supply',
  'Training & Skills Development',
  'Environmental Management',
  'Administration',
  'Operations'
];

export const INDUSTRIES = ['Mining & Construction', 'Manufacturing', 'Logistics & Transport', 'Energy', 'Government', 'Retail'];

export const EDUCATION_LEVELS = [
  'Grade 12 / Matric',
  'National Certificate',
  'National Diploma',
  "Bachelor's Degree",
  'Honours Degree',
  'Postgraduate'
];

export const WORKING_HOURS_OPTIONS = [
  'Monday–Friday, 08:00–17:00',
  'Monday–Friday, 07:00–16:00',
  'Shift work',
  'Flexible hours'
];

export const SA_LANGUAGES = [
  'English',
  'Afrikaans',
  'Zulu',
  'Xhosa',
  'Sotho',
  'Tswana',
  'Venda',
  'Tsonga',
  'Swati',
  'Ndebele',
  'Northern Sotho'
];

export const EMPLOYEE_BENEFITS = [
  'Medical aid contribution',
  'Provident fund',
  'Performance bonus',
  'Travel allowance',
  'Cellphone allowance'
];

export const CURRENCIES = ['ZAR', 'USD', 'GBP', 'EUR'];

// Job titles, responsibilities and requirements below draw on Kamosa's own actual service
// capabilities (src/data/services.ts) rather than generic filler, so suggestions stay grounded in
// what the company really does.
export const JOB_TITLE_SUGGESTIONS = [
  'Health and Safety Officer',
  'SHEQ Officer',
  'Training Facilitator',
  'Environmental Officer',
  'Procurement Officer',
  'Business Development Consultant',
  'Administrative Assistant'
];

export const RESPONSIBILITY_SUGGESTIONS = [
  'Develop and maintain construction health and safety files',
  'Conduct Hazard Identification and Risk Assessments (HIRA)',
  'Perform legal compliance audits against applicable legislation',
  'Investigate and report on workplace incidents',
  'Develop and maintain emergency preparedness and response plans',
  'Maintain legal appointment registers',
  'Prepare tender safety documentation',
  'Communicate effectively with clients and site teams',
  'Maintain accurate records and documentation'
];

export const REQUIREMENT_SUGGESTIONS = [
  'SACPCMP registration',
  'Valid driver’s license and own transport',
  'Knowledge of the OHS Act and Construction Regulations',
  'Strong report-writing and documentation skills',
  'Relevant industry experience',
  'Ability to work independently on client sites'
];

export const APPLICATION_INSTRUCTION_SUGGESTIONS = [
  'Please submit an up-to-date CV.',
  'Include copies of relevant qualifications where requested.',
  'Ensure your contact details are correct before submitting.',
  'Complete all required screening questions before submitting your application.'
];

export const APPLICATION_NOTE_TEMPLATES = [
  'CV reviewed.',
  'Meets the initial requirements.',
  'Additional information requested.',
  'Shortlisted for an interview.',
  'Interview scheduled.',
  'Offer prepared.',
  'Application unsuccessful.',
  'Candidate withdrew application.'
];

export const CONTACT_MESSAGE_PROMPTS = [
  'We need a site safety audit.',
  'We need help preparing tender safety documentation.',
  'We need ongoing SHEQ support for our site.',
  'We’d like a quote for training.',
  'We need procurement support for PPE or safety equipment.'
];

export const PROJECT_DESCRIPTION_PROMPTS = [
  'We’re opening a new site and need guidance on compliance requirements.',
  'We need a legal compliance audit before an upcoming inspection.',
  'We need PPE supplied for our team.',
  'We need training arranged for our staff.'
];

export const QUALIFICATION_SUGGESTIONS = [
  'SAMTRAC certificate',
  'SACPCMP registration',
  'COMSOC 1 & 2',
  'National Diploma in Safety Management',
  'First Aid Level 3',
  'Certified Fall Protection Plan Developer'
];
