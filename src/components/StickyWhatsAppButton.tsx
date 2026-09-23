import { MessageCircleIcon } from 'lucide-react';
import { company } from '../data/company';

/**
 * Mobile-only floating WhatsApp button per docs/CONVERSION_STRATEGY.md §6 — supplements the
 * equal-placement inline WhatsAppButton (hero, CTASection), does not replace it. Hidden on desktop
 * (sm:hidden) since the inline placements already cover that context.
 */
export function StickyWhatsAppButton() {
  const href = `https://wa.me/${company.whatsappNumber}?text=${encodeURIComponent("Hi, I'd like to find out more about Kamosa's services.")}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Kamosa on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-success-600 text-white shadow-lift transition-transform duration-200 ease-editorial hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:hidden">
      <MessageCircleIcon className="h-6 w-6" aria-hidden={true} />
    </a>
  );
}
