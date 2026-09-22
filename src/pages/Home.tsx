import { Seo } from '../components/Seo';
import { Hero } from '../components/Hero';
import { TrustStrip } from '../components/TrustStrip';
import { AboutSection } from '../components/AboutSection';
import { ServicesGrid } from '../components/ServicesGrid';
import { IndustryGrid } from '../components/IndustryGrid';
import { ExperienceSection } from '../components/ExperienceSection';
import { WhyKamosa } from '../components/WhyKamosa';
import { Methodology } from '../components/Methodology';
import { Leadership } from '../components/Leadership';
import { EnvironmentalSection } from '../components/EnvironmentalSection';
import { CTASection } from '../components/CTASection';

export function Home() {
  return (
    <>
      <Seo
        title="Kamosa (Pty) Ltd | Health, Safety, Compliance & Business Solutions"
        description="Kamosa (Pty) Ltd provides professional health, safety and compliance, business consulting, procurement and training solutions across South Africa."
        image="/d88a7876-ba83-4c30-b30d-f9cb4387d34e.jpg" />
      
      <Hero />
      <TrustStrip />
      <AboutSection />
      <ServicesGrid background="cream" />
      <IndustryGrid />
      <ExperienceSection condensed />
      <WhyKamosa />
      <Methodology />
      <Leadership condensed />
      <EnvironmentalSection />
      <CTASection />
    </>);

}