import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { AlertCircleIcon, AlarmClockIcon, CheckCircle2Icon, MoreHorizontalIcon, XIcon } from 'lucide-react';
import { FOLLOW_UP_LABEL, STATUS_BADGE, STATUS_DOT, formatDateOnly } from '../../lib/enquiries';
import type { FollowUpState } from '../../lib/enquiries';

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.75rem] font-semibold ring-1 ring-inset ${
        STATUS_BADGE[status] ?? 'bg-[#F1EFEE] text-ink-700 ring-ink-700/15'
      }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status] ?? 'bg-ink-700/50'}`} aria-hidden={true} />
      {status}
    </span>
  );
}

const FOLLOW_UP_STYLE: Record<Exclude<FollowUpState, null>, string> = {
  overdue: 'text-error-600',
  today: 'text-warning-600',
  soon: 'text-warning-600',
  scheduled: 'text-muted'
};

export function FollowUpIndicator({ state, date }: { state: FollowUpState; date: string | null | undefined }) {
  if (!state || !date) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[0.75rem] font-medium ${FOLLOW_UP_STYLE[state]}`}>
      <AlarmClockIcon className="h-3.5 w-3.5" aria-hidden={true} />
      <span>
        {state === 'scheduled' ? 'Follow up' : FOLLOW_UP_LABEL[state]}
        {state === 'today' ? '' : ` · ${formatDateOnly(date)}`}
      </span>
    </span>
  );
}

export interface MenuItem {
  label: string;
  icon?: typeof CheckCircle2Icon;
  onSelect?: () => void;
  href?: string;
  disabled?: boolean;
  /** Renders a non-interactive group heading instead of an item. */
  heading?: boolean;
  current?: boolean;
}

/**
 * Compact row action menu. Keyboard: Enter/Space/ArrowDown opens and focuses the first item,
 * ArrowUp/ArrowDown/Home/End move, Escape closes and returns focus to the trigger, Tab closes.
 */
export function ActionMenu({ label, items, align = 'right' }: { label: string; items: MenuItem[]; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const focusables = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []);

  // The menu is position: fixed and anchored to the trigger, so it's never clipped by the table's
  // scroll container or the rounded list card. It opens below the trigger, flips above near the
  // bottom of the viewport, and follows the trigger while the page scrolls or resizes.
  const place = useCallback(() => {
    const menu = menuRef.current;
    if (!menu || !triggerRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const { width, height } = menu.getBoundingClientRect();
    const gap = 4;
    const below = trigger.bottom + gap;
    const above = trigger.top - gap - height;
    // Below if it fits, else above if that fits, else pinned to the bottom edge (it scrolls inside).
    const top = below + height <= window.innerHeight - 8 ? below : above >= 8 ? above : window.innerHeight - height - 8;
    const preferred = align === 'right' ? trigger.right - width : trigger.left;
    menu.style.top = `${Math.max(8, top)}px`;
    menu.style.left = `${Math.min(Math.max(8, preferred), window.innerWidth - width - 8)}px`;
    menu.style.visibility = 'visible';
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    focusables()[0]?.focus({ preventScroll: true });
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent | TouchEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    let frame = 0;
    const follow = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    window.addEventListener('scroll', follow, true);
    window.addEventListener('resize', follow);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      window.removeEventListener('scroll', follow, true);
      window.removeEventListener('resize', follow);
    };
  }, [open, place]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const onMenuKeyDown = (event: KeyboardEvent) => {
    const list = focusables();
    const index = list.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      list[(index + 1) % list.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      list[(index - 1 + list.length) % list.length]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      list[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      list[list.length - 1]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      close(false);
    }
  };

  const itemClass =
    'flex w-full items-center gap-2.5 px-3 py-2 text-left text-[0.8125rem] text-ink-900 outline-none transition-colors duration-150 hover:bg-[#F4F2F1] focus:bg-[#F4F2F1] aria-disabled:cursor-not-allowed aria-disabled:opacity-50';

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted transition-colors duration-150 hover:border-hairline hover:bg-white hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-600">
        <MoreHorizontalIcon className="h-4 w-4" aria-hidden={true} />
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          style={{ position: 'fixed', top: 0, left: 0, visibility: 'hidden' }}
          className="z-40 max-h-[70vh] w-56 overflow-y-auto rounded-lg border border-hairline bg-white py-1 shadow-lift">
          {items.map((item, index) => {
            if (item.heading) {
              return (
                <div
                  key={`h-${index}`}
                  role="presentation"
                  className="mt-1 border-t border-hairline px-3 pb-1 pt-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted first:mt-0 first:border-t-0">
                  {item.label}
                </div>
              );
            }
            const content = (
              <>
                {item.icon ? <item.icon className="h-4 w-4 shrink-0 text-muted" aria-hidden={true} /> : <span className="w-4" aria-hidden={true} />}
                <span className="flex-1">{item.label}</span>
                {item.current ? <span className="text-[0.6875rem] font-semibold text-muted">Current</span> : null}
              </>
            );
            if (item.href) {
              return (
                <a key={item.label} role="menuitem" tabIndex={-1} href={item.href} className={itemClass} onClick={() => close(false)}>
                  {content}
                </a>
              );
            }
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                tabIndex={-1}
                aria-disabled={item.disabled || undefined}
                className={itemClass}
                onClick={() => {
                  if (item.disabled) return;
                  close();
                  item.onSelect?.();
                }}>
                {content}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export interface ToastMessage {
  id: number;
  tone: 'success' | 'error';
  text: string;
}

export function ToastRegion({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: number) => void }) {
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border bg-white px-4 py-3 text-[0.8125rem] shadow-lift ${
            toast.tone === 'success' ? 'border-success-600/30' : 'border-error-600/30'
          }`}>
          {toast.tone === 'success' ? (
            <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden={true} />
          ) : (
            <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-error-600" aria-hidden={true} />
          )}
          <p className="flex-1 text-ink-900">{toast.text}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
            className="-mr-1 rounded p-0.5 text-muted hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">
            <XIcon className="h-3.5 w-3.5" aria-hidden={true} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function SectionHeading({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-muted">{children}</h3>
      {action}
    </div>
  );
}
