import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { company as companyDefaults } from '../data/company';

/** The subset of company.ts fields the admin can edit from Settings — phone, WhatsApp number,
 * email, and tagline. Everything else (registration number, CSD, managing director, etc.) stays
 * code-only per docs/DECISIONS.md's "don't assume a new fact" posture, so it isn't part of this
 * context at all. */
interface EditableCompanyFields {
  phone: string;
  phoneHref: string;
  whatsappNumber: string;
  email: string;
  emailHref: string;
  tagline: string;
  /** Empty string = no admin override set; callers fall back to their own hardcoded SEO copy. */
  homepageSeoTitle: string;
  homepageSeoDescription: string;
}

const defaultValue: EditableCompanyFields = {
  phone: companyDefaults.phone,
  phoneHref: companyDefaults.phoneHref,
  whatsappNumber: companyDefaults.whatsappNumber,
  email: companyDefaults.email,
  emailHref: companyDefaults.emailHref,
  tagline: companyDefaults.tagline,
  homepageSeoTitle: '',
  homepageSeoDescription: ''
};

const CompanyContext = createContext<EditableCompanyFields>(defaultValue);

function toPhoneHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return `tel:${digits.startsWith('+') ? digits : `+27${digits.replace(/^0/, '')}`}`;
}

/**
 * Wraps the public site (not the admin shell — there's nothing to override there) with the
 * hardcoded defaults from src/data/company.ts rendered immediately, synchronously, on first paint
 * — no loading flash, no layout shift. A background fetch to /api/company then applies any
 * admin-set overrides. If that fetch fails, is slow, or returns nothing, the defaults already on
 * screen simply stay — the live site can never go blank or broken because of this.
 */
export function CompanyProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<EditableCompanyFields>(defaultValue);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/company')
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: Partial<
            Record<'phone' | 'whatsappNumber' | 'email' | 'tagline' | 'homepageSeoTitle' | 'homepageSeoDescription', string>
          > | null
        ) => {
          if (cancelled || !data) return;
          setValue((prev) => ({
            phone: data.phone || prev.phone,
            phoneHref: data.phone ? toPhoneHref(data.phone) : prev.phoneHref,
            whatsappNumber: data.whatsappNumber || prev.whatsappNumber,
            email: data.email || prev.email,
            emailHref: data.email ? `mailto:${data.email}` : prev.emailHref,
            tagline: data.tagline || prev.tagline,
            homepageSeoTitle: data.homepageSeoTitle || prev.homepageSeoTitle,
            homepageSeoDescription: data.homepageSeoDescription || prev.homepageSeoDescription
          }));
        }
      )
      .catch(() => {
        // Network/parse failure — the defaults already rendered stay exactly as they are.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany(): EditableCompanyFields {
  return useContext(CompanyContext);
}
