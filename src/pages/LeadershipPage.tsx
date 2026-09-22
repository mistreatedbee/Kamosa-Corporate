import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Leadership } from '../components/Leadership';
import { ValuesSection } from '../components/ValuesSection';
import { CTASection } from '../components/CTASection';

export function LeadershipPage() {
  return (
    <>
      <Seo
        title="Leadership | Kamosa (Pty) Ltd"
        description="Kamosa is led by Managing Director Lovedonia Mmola, a SACPCMP-registered Construction Health and Safety Manager with multi-sector experience." />
      
      <PageHeader
        eyebrow="Professional Leadership"
        title="Experienced leadership. Practical industry knowledge."
        body="Kamosa is led by a registered professional with direct site experience across mining, construction, manufacturing, transport and energy environments."
        crumbs={[{ label: 'Leadership' }]} />
      
      <Leadership />
      <ValuesSection />
      <CTASection />
    </>);

}