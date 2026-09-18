import React from 'react';
import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { ServicesGrid } from '../components/ServicesGrid';
import { Methodology } from '../components/Methodology';
import { EnvironmentalSection } from '../components/EnvironmentalSection';
import { CTASection } from '../components/CTASection';

export function Services() {
  return (
    <>
      <Seo
        title="Services | Kamosa (Pty) Ltd"
        description="Four integrated service lines from Kamosa (Pty) Ltd: health, safety and compliance; business consulting; procurement and supply; and training and skills development." />
      
      <PageHeader
        eyebrow="What We Do"
        title="Professional solutions for complex operational environments."
        body="Four integrated service lines designed to help organisations meet legal obligations while improving day-to-day operational performance."
        crumbs={[{ label: 'Services' }]}
        image={{
          src: "/6953ae5b-bad6-4605-8723-dfb7660c5160.jpg",
          alt: ''
        }} />
      
      <ServicesGrid withHeader={false} />
      <Methodology />
      <EnvironmentalSection />
      <CTASection />
    </>);

}