import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { ExperienceSection } from '../components/ExperienceSection';
import { IndustryGrid } from '../components/IndustryGrid';
import { Credentials } from '../components/Credentials';
import { CTASection } from '../components/CTASection';

export function Experience() {
  return (
    <>
      <Seo
        title="Experience & Track Record | Kamosa (Pty) Ltd"
        description="Multi-sector SHE experience across energy, mining, construction, manufacturing and transport environments, including support on major Eskom power station projects." />
      
      <PageHeader
        eyebrow="Track Record"
        title="Experience that understands high-risk environments."
        body="Six-plus years of multi-sector SHE experience across energy, mining, construction, manufacturing and transport operations in South Africa."
        crumbs={[{ label: 'Experience' }]}
        image={{
          src: "/b76d2b7a-7818-46e5-b7bf-f5d2c83d947f.jpg",
          alt: ''
        }} />
      
      <ExperienceSection />
      <IndustryGrid />
      <Credentials />
      <CTASection />
    </>);

}