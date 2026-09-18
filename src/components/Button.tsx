import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'outline' | 'text';

const base =
'group inline-flex items-center justify-center gap-2.5 font-display text-sm font-semibold tracking-tight transition-[background-color,color,border-color,box-shadow] duration-200 ease-editorial';

const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white px-6 py-3.5 hover:bg-ink-700 rounded-sm',
  secondary: 'bg-gold text-ink-900 px-6 py-3.5 hover:bg-gold-soft rounded-sm',
  outline:
  'border border-hairline text-ink-900 px-6 py-3.5 hover:border-ink-900 hover:bg-cream rounded-sm bg-transparent',
  text: 'text-ink-900 hover:text-brand-600 p-0'
};

const invertedVariants: Partial<Record<Variant, string>> = {
  outline: 'border border-white/30 text-white px-6 py-3.5 hover:border-white hover:bg-white/10 rounded-sm',
  text: 'text-white hover:text-gold p-0'
};

interface CommonProps {
  children: React.ReactNode;
  variant?: Variant;
  withArrow?: boolean;
  inverted?: boolean;
  className?: string;
}

function classesFor({ variant = 'primary', inverted, className = '' }: CommonProps) {
  const variantClass = inverted && invertedVariants[variant] || variants[variant];
  return `${base} ${variantClass} ${className}`;
}

function Arrow() {
  return (
    <ArrowRightIcon
      className="h-4 w-4 shrink-0 transition-transform duration-200 ease-editorial group-hover:translate-x-1"
      aria-hidden="true" />);


}

interface ButtonLinkProps extends CommonProps {
  to: string;
}

export function ButtonLink({ to, children, withArrow = true, ...rest }: ButtonLinkProps) {
  return (
    <Link to={to} className={classesFor({ children, withArrow, ...rest })}>
      <span>{children}</span>
      {withArrow ? <Arrow /> : null}
    </Link>);

}

interface ButtonAnchorProps extends CommonProps {
  href: string;
}

export function ButtonAnchor({ href, children, withArrow = true, ...rest }: ButtonAnchorProps) {
  return (
    <a href={href} className={classesFor({ children, withArrow, ...rest })}>
      <span>{children}</span>
      {withArrow ? <Arrow /> : null}
    </a>);

}

interface ButtonProps extends CommonProps {
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({ children, withArrow = false, type = 'button', onClick, disabled, ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${classesFor({ children, withArrow, ...rest })} disabled:cursor-not-allowed disabled:opacity-60`}>
      
      <span>{children}</span>
      {withArrow ? <Arrow /> : null}
    </button>);

}