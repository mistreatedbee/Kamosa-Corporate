import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://www.kamosa.co.za';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

interface SeoProps {
  title: string;
  description: string;
  /** Optional absolute or CDN image URL for social cards. */
  image?: string;
  /** Portal/admin routes must not be indexed — per docs/SEO_ACCESSIBILITY_PLAN.md. */
  noindex?: boolean;
}

export function Seo({ title, description, image, noindex = false }: SeoProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    const canonical = `${SITE_URL}${pathname === '/' ? '' : pathname}`;
    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    upsertLink('canonical', canonical);

    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', 'Kamosa (Pty) Ltd');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:locale', 'en_ZA');

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);

    if (image) {
      upsertMeta('property', 'og:image', image);
      upsertMeta('name', 'twitter:image', image);
    }
  }, [title, description, image, noindex, pathname]);

  return null;
}

/*
 * Organization structured data. LocalBusiness schema is deliberately NOT used:
 * it requires a confirmed physical address, which the client has not yet supplied.
 *
 * CSP COUPLING: this script's exact JSON content is allow-listed in vercel.json's
 * Content-Security-Policy via a sha256 hash (script-src). If you change ANY byte of the
 * object below, the CSP hash goes stale and this script gets silently blocked in production
 * again (search engines lose the structured data — no visible breakage otherwise). Recompute
 * with `node -e "console.log('sha256-' + require('crypto').createHash('sha256').update(<paste-the-exact-json-string>).digest('base64'))"`
 * or read the real value from a securitypolicyviolation event / Chrome's console warning
 * against a live deploy, and update vercel.json's script-src to match.
 */
export function OrganizationSchema() {
  useEffect(() => {
    const id = 'kamosa-organization-schema';
    if (document.getElementById(id)) return;
    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Kamosa (Pty) Ltd',
      alternateName: 'Kamosa',
      url: SITE_URL,
      email: 'info@kamosa.co.za',
      telephone: '+27 71 191 4744',
      slogan: 'Building Trust Through Professional Excellence',
      areaServed: { '@type': 'Country', name: 'South Africa' },
      knowsAbout: [
      'Occupational health and safety compliance',
      'Business consulting',
      'Procurement and supply',
      'Training and skills development']

    });
    document.head.appendChild(script);
  }, []);

  return null;
}