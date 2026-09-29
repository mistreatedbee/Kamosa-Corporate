import type { AdditionalService } from '../types/content';

/**
 * Additional service offerings shown on the /services page, distinct from the four core
 * ServiceLine entries in services.ts (which route to dedicated /services/:slug detail pages).
 * These don't have detail pages of their own yet — "Learn More" routes to /contact as the
 * low-friction general enquiry path. If any of these grow a dedicated page later, swap `to` here.
 */
export const additionalServices: AdditionalService[] = [
{
  slug: 'employee-wellness',
  title: 'Employee Wellness Services',
  description:
  'Supporting healthier, more productive workplaces through employee wellness initiatives and support programmes designed to promote employee wellbeing and create a healthier working environment.',
  icon: 'wellness',
  ctaLabel: 'Learn More',
  to: '/contact'
},
{
  slug: 'safecloud-africa',
  title: 'SafeCloud Africa',
  description:
  'Digital safety and compliance solutions designed to simplify workplace health and safety management, documentation and reporting.',
  icon: 'safecloud',
  ctaLabel: 'View SafeCloud Africa',
  externalUrl: 'https://safecloudafrica.co.za/',
  secondaryCtaLabel: 'View Pricing'
},
{
  slug: 'safety-officer-mentoring',
  title: 'Safety Officer Mentoring',
  description:
  'Practical mentoring and guidance designed to help safety officers develop their skills, strengthen compliance practices and effectively manage workplace safety responsibilities.',
  icon: 'mentoring',
  ctaLabel: 'Learn More',
  to: '/contact'
},
{
  slug: 'sheq-support',
  title: 'SHEQ Support',
  description:
  'Professional support across Safety, Health, Environment and Quality (SHEQ) to help organisations improve processes, strengthen compliance and build a positive safety culture.',
  icon: 'sheq',
  ctaLabel: 'Learn More',
  to: '/contact'
}];
