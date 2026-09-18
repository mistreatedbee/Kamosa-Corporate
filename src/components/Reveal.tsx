import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface RevealProps {
  children: React.ReactNode;
  /** Stagger index — each step adds 60ms, capped at 5 steps. */
  index?: number;
  className?: string;
  as?: 'div' | 'li' | 'article' | 'section';
}

export function Reveal({ children, index = 0, className = '', as = 'div' }: RevealProps) {
  const reduceMotion = useReducedMotion();
  const MotionTag = motion[as];

  if (reduceMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.45,
        delay: Math.min(index, 5) * 0.06,
        ease: [0.23, 1, 0.32, 1]
      }}>
      
      {children}
    </MotionTag>);

}