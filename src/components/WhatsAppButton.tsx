import { MessageCircleIcon } from 'lucide-react';
import { company } from '../data/company';

interface WhatsAppButtonProps {
  /** Service-aware pre-filled message, e.g. "Hi, I'm interested in Health, Safety & Compliance and would like a quote." */
  message?: string;
  inverted?: boolean;
  className?: string;
}

/**
 * Per docs/CONVERSION_STRATEGY.md §6: an equal, parallel alternative to the form CTA, not a
 * fallback — outlined style so it's visually distinct from the filled primary button while
 * remaining the same size/prominence. Only wired up once the number was confirmed WhatsApp-
 * enabled (071 191 4744).
 */
export function WhatsAppButton({ message, inverted = false, className = '' }: WhatsAppButtonProps) {
  const defaultMessage = "Hi, I'd like to find out more about Kamosa's services.";
  const href = `https://wa.me/${company.whatsappNumber}?text=${encodeURIComponent(message ?? defaultMessage)}`;

  const toneClass = inverted
    ? 'border border-white/30 text-white hover:border-white hover:bg-white/10'
    : 'border border-hairline text-ink-900 hover:border-ink-900 hover:bg-cream';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center justify-center gap-2.5 rounded-sm px-6 py-3.5 font-display text-sm font-semibold tracking-tight transition-colors duration-200 ease-editorial focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${toneClass} ${className}`}>
      <MessageCircleIcon className="h-4 w-4 shrink-0" aria-hidden={true} />
      <span>WhatsApp Us</span>
    </a>
  );
}
