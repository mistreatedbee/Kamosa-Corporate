import type { SafeCloudPlan, SheqConsultingOffer } from '../types/content';

/**
 * SafeCloud Africa pricing — kept separate from the presentation layer (SafeCloudPricingModal.tsx)
 * specifically so pricing can be updated without touching any UI code. Prices, employee ranges,
 * and plan names are exact as supplied — do not round, reformat, or otherwise alter them.
 */
export const safeCloudPlans: SafeCloudPlan[] = [
{
  name: 'Starter',
  employees: '1–15 employees',
  price: 'R650',
  period: '/month',
  description: 'Ideal for small businesses and growing teams.',
  features: ['Core platform access', 'Document and task workflows', 'Email support'],
  cta: 'Choose Starter Plan',
  url: 'https://safecloudafrica.co.za/register'
},
{
  name: 'Professional',
  employees: '16–40 employees',
  price: 'R950',
  period: '/month',
  description: 'Built for growing operations with more oversight needs.',
  features: ['All core modules', 'Advanced reporting', 'Priority support'],
  cta: 'Choose Professional Plan',
  url: 'https://safecloudafrica.co.za/register'
},
{
  name: 'Business',
  employees: '41–100 employees',
  price: 'R1,799',
  period: '/month',
  description: 'Designed for scaling organisations with broader oversight needs.',
  features: ['Expanded operational controls', 'Cross-team compliance visibility', 'Enhanced support'],
  cta: 'Choose Business Plan',
  url: 'https://safecloudafrica.co.za/register',
  mostPopular: true
},
{
  name: 'Enterprise',
  employees: '101–250 employees',
  price: 'R3,200',
  period: '/month',
  description: 'For large organisations that need deeper safety oversight.',
  features: ['Full platform access', 'Dedicated support coverage', 'Free SHEQ Support'],
  cta: 'Choose Enterprise Plan',
  url: 'https://safecloudafrica.co.za/register'
},
{
  name: 'Corporate',
  employees: '251+ employees',
  price: 'R4,200',
  period: '/month',
  description: 'For large organisations that need broader corporate oversight.',
  features: ['Full platform access', 'Dedicated support coverage', 'Free SHEQ Support'],
  cta: 'Choose Corporate Plan',
  url: 'https://safecloudafrica.co.za/register'
},
{
  name: 'Custom',
  employees: 'Tailored scope',
  price: 'Quote',
  period: 'by request',
  description: 'Bespoke configuration for organisations with unique requirements.',
  features: ['Tailored modules', 'Custom onboarding', 'Dedicated support'],
  cta: 'Request a Quote',
  mailto: 'mailto:support@safecloud.africa?subject=Custom%20quote%20request'
}];


export const sheqConsulting: SheqConsultingOffer = {
  title: 'SHEQ Support — Consulting',
  description: 'Risk assessment, investigations, audits, mentorship and more.',
  rate: 'R350',
  rateUnit: '/hour',
  cta: 'Request SHEQ Support',
  mailto: 'mailto:support@safecloud.africa?subject=SHEQ%20Support%20inquiry'
};
