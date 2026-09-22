import { CheckCircle2Icon, ClockIcon } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Container } from '../components/Container';
import { Reveal } from '../components/Reveal';
import { company } from '../data/company';

interface CredentialItem {
  label: string;
  detail?: string;
}

// Confirmed per docs/KAMOSA_COMPANY_PROFILE.md — verified, safe to present as fact.
const CONFIRMED: CredentialItem[] = [
{ label: 'Registered South African private company', detail: `Registration No. ${company.registration}` },
{ label: 'Active CSD (Central Supplier Database) supplier', detail: `CSD No. ${company.csd}` },
{ label: 'Level 1 B-BBEE Contributor', detail: '135% procurement recognition' },
{ label: '100% Black Female Owned' },
{ label: 'SACPCMP-registered Construction Health and Safety Manager', detail: 'Company leadership' },
{ label: 'Member, South African Institute of Occupational Safety and Health (SAIOSH)', detail: 'Company leadership' }];


// Explicitly flagged in the company profile as unconfirmed — per docs/KAMOSA_COMPANY_PROFILE.md's
// master list, these must render as "information to be confirmed," never as a verified claim.
const PENDING: CredentialItem[] = [
{
  label: 'SARS Tax Compliance Status (TCS) PIN',
  detail: 'Renewal status to be confirmed and reissued before being presented as current.'
},
{
  label: 'SACPCMP registration number',
  detail: 'Registration is confirmed; the specific number is pending confirmation for publication.'
},
{
  label: 'SAIOSH membership grade',
  detail: 'Membership is confirmed; the specific grade (Member / Graduate / Technical Member) is pending confirmation.'
}];


export function Credentials() {
  return (
    <>
      <Seo
        title="Credentials | Kamosa (Pty) Ltd"
        description="Kamosa (Pty) Ltd credential verification — registration, CSD status, B-BBEE level, and professional registrations." />

      <PageHeader
        eyebrow="Credentials"
        title="Credential verification information."
        body="A transparent record of Kamosa's confirmed registrations and status, and the items still pending confirmation before they are published as verified."
        crumbs={[{ label: 'Credentials' }]} />

      <section className="kamosa-section bg-white" aria-label="Confirmed credentials">
        <Container>
          <Reveal>
            <h2 className="font-display text-[0.75rem] font-bold uppercase tracking-[0.16em] text-ink-900">
              Confirmed
            </h2>
          </Reveal>
          <Reveal index={1}>
            <ul className="mt-6 divide-y divide-hairline border border-hairline">
              {CONFIRMED.map((item) => (
                <li key={item.label} className="flex items-start gap-4 px-5 py-5">
                  <CheckCircle2Icon className="mt-0.5 h-5 w-5 shrink-0 text-success-600" aria-hidden={true} />
                  <div>
                    <p className="font-display text-[0.9375rem] font-semibold text-ink-900">{item.label}</p>
                    {item.detail ? <p className="mt-1 text-[0.8125rem] text-muted">{item.detail}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      <section className="kamosa-section bg-cream" aria-label="Pending confirmation">
        <Container>
          <Reveal>
            <h2 className="font-display text-[0.75rem] font-bold uppercase tracking-[0.16em] text-ink-900">
              Information to be confirmed
            </h2>
            <p className="mt-3 max-w-prose text-[0.9375rem] leading-relaxed text-muted">
              These items are not yet presented as verified. Kamosa is asked to confirm each one directly before it
              is published as fact.
            </p>
          </Reveal>
          <Reveal index={1}>
            <ul className="mt-6 divide-y divide-hairline border border-hairline bg-white">
              {PENDING.map((item) => (
                <li key={item.label} className="flex items-start gap-4 px-5 py-5">
                  <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-warning-600" aria-hidden={true} />
                  <div>
                    <p className="font-display text-[0.9375rem] font-semibold text-ink-900">{item.label}</p>
                    {item.detail ? <p className="mt-1 text-[0.8125rem] text-muted">{item.detail}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
