'use client';

import type { ReactNode } from 'react';

export type SpeciesKey =
  | 'dog'
  | 'cat'
  | 'hamster'
  | 'parrot'
  | 'fish'
  | 'turtle'
  | 'rabbit'
  | 'unknown';

export function getSpeciesKey(species?: string | null): SpeciesKey {
  const s = (species || '').toLowerCase();
  if (s.includes('собак') || s.includes('dog')) return 'dog';
  if (s.includes('кош') || s.includes('кот') || s.includes('cat')) return 'cat';
  if (s.includes('хомяк') || s.includes('hamster')) return 'hamster';
  if (s.includes('попугай') || s.includes('parrot')) return 'parrot';
  if (s.includes('рыбк') || s.includes('fish')) return 'fish';
  if (s.includes('черепах') || s.includes('turtle')) return 'turtle';
  if (s.includes('кролик') || s.includes('rabbit')) return 'rabbit';
  return 'unknown';
}

const paths: Record<SpeciesKey, ReactNode> = {
  dog: (
    <>
      <circle cx="24" cy="26" r="11" />
      <path d="M13.5 23c-3.5-1-5-6.5-3.8-11 4.5-.5 8 1.8 9 6.5" />
      <path d="M34.5 23c3.5-1 5-6.5 3.8-11-4.5-.5-8 1.8-9 6.5" />
      <circle cx="20" cy="25" r="0.6" fill="currentColor" />
      <circle cx="28" cy="25" r="0.6" fill="currentColor" />
      <ellipse cx="24" cy="29.5" rx="2" ry="1.5" />
      <path d="M24 31v2.5M24 33.5c-1.8 1.8-4.5 1.8-6 0M24 33.5c1.8 1.8 4.5 1.8 6 0" />
    </>
  ),
  cat: (
    <>
      <circle cx="24" cy="27" r="10" />
      <path d="M16 21l-3-10 8.5 5M32 21l3-10-8.5 5" />
      <circle cx="20" cy="26" r="0.6" fill="currentColor" />
      <circle cx="28" cy="26" r="0.6" fill="currentColor" />
      <path d="M22 30.5h4l-2 2.2z" />
      <path d="M9 28.5h6M9.5 32.5l5.8-1M39 28.5h-6M38.5 32.5l-5.8-1" />
    </>
  ),
  hamster: (
    <>
      <ellipse cx="24" cy="28" rx="12" ry="10" />
      <circle cx="14.5" cy="18.5" r="3" />
      <circle cx="33.5" cy="18.5" r="3" />
      <circle cx="20" cy="27" r="0.6" fill="currentColor" />
      <circle cx="28" cy="27" r="0.6" fill="currentColor" />
      <path d="M24 30.5v2M22 33.5c1 1.2 3 1.2 4 0" />
      <path d="M15 31c1.5 2.5 4 4 6.5 4.5M33 31c-1.5 2.5-4 4-6.5 4.5" />
    </>
  ),
  parrot: (
    <>
      <path d="M8 39h32" />
      <path d="M25 37c-5.5-1.5-9-6-9-11.5C16 19 20.5 14 26 14c4.5 0 8 3.2 8.6 7.5l4.4 2.6-4.2 1.2c-.8 5-4.4 9.4-9.8 11.7z" />
      <path d="M16.5 22.5L11 24.5l5.5 2" />
      <circle cx="22.5" cy="20" r="0.6" fill="currentColor" />
      <path d="M27 14c.2-3 2-5 5-5.5" />
      <path d="M21 37l-2.5 5" />
    </>
  ),
  fish: (
    <>
      <ellipse cx="21" cy="24" rx="10" ry="7" />
      <path d="M31 24l8.5-6.5v13z" />
      <circle cx="16.5" cy="22.5" r="0.6" fill="currentColor" />
      <path d="M24 18.5c-1.2 3.4-1.2 7.6 0 11" />
      <path d="M14 27.5c2 1.5 4.5 2.2 7 2" />
    </>
  ),
  turtle: (
    <>
      <path d="M9 30c0-8 6.5-14 15-14s15 6 15 14" />
      <path d="M24 16v14M16.5 19.5L13.5 30M31.5 19.5l3 10.5" />
      <path d="M7 30h34" />
      <circle cx="40" cy="26.5" r="3" />
      <path d="M14 30v4.5M30 30v4.5" />
    </>
  ),
  rabbit: (
    <>
      <ellipse cx="26" cy="31" rx="10" ry="8" />
      <path d="M21 24c-2-7-2-13.5.5-18 2.8.5 3.8 7 3.3 14" />
      <path d="M29.5 24c.5-7 2-12.5 5-15 2 2.5.8 9.5-1.5 15" />
      <circle cx="23.5" cy="30" r="0.6" fill="currentColor" />
      <path d="M31 34.5c2 .5 4 .3 5.5-.8" />
    </>
  ),
  unknown: (
    <>
      <path d="M24 27c-5.2 0-9.5 3.6-9.5 7.5 0 2.6 2.1 4.2 4.7 4.2 1.5 0 2.6-.5 4.8-.5s3.3.5 4.8.5c2.6 0 4.7-1.6 4.7-4.2 0-3.9-4.3-7.5-9.5-7.5z" />
      <ellipse cx="12" cy="17.5" rx="2.6" ry="3.4" />
      <ellipse cx="19" cy="11.5" rx="2.6" ry="3.4" />
      <ellipse cx="29" cy="11.5" rx="2.6" ry="3.4" />
      <ellipse cx="36" cy="17.5" rx="2.6" ry="3.4" />
    </>
  ),
};

interface SpeciesIconProps {
  species?: string | null;
  iconKey?: SpeciesKey;
  className?: string;
}

export default function SpeciesIcon({ species, iconKey, className = 'h-14 w-14' }: SpeciesIconProps) {
  const key = iconKey ?? getSpeciesKey(species);
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[key]}
    </svg>
  );
}
