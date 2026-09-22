import { Seo } from '../components/Seo';
import { Container } from '../components/Container';
import { ButtonLink } from '../components/Button';

export function NotFound() {
  return (
    <>
      <Seo title="Page not found | Kamosa (Pty) Ltd" description="The page you requested could not be found." />
      <section className="bg-white pt-[76px]">
        <Container className="flex min-h-[60vh] flex-col justify-center py-24">
          <p className="font-display text-eyebrow font-semibold uppercase text-gold">Error 404</p>
          <h1 className="mt-6 max-w-2xl text-display-md text-balance text-ink-900">
            The page you requested could not be found.
          </h1>
          <p className="mt-6 max-w-prose text-[1.0625rem] leading-relaxed text-muted">
            The link may be out of date. You can return to the homepage or contact us directly and we will point you to
            the right place.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <ButtonLink to="/">Back to homepage</ButtonLink>
            <ButtonLink to="/contact" variant="outline">
              Contact Kamosa
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>);

}