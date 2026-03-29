"use client";
import { t } from '../lib/theme';

export function IconChicken({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 4c2 0 3.5 1.5 3.5 3.5S14 11 12 11s-3.5-1.5-3.5-3.5S10 4 12 4z" fill="#f0c040" stroke="#d4a933" strokeWidth="1" />
      <path d="M9 11c-1 0-2 1-2 2v5c0 2 1.5 3 3 3h4c1.5 0 3-1 3-3v-5c0-1-1-2-2-2" fill="#f0c040" stroke="#d4a933" strokeWidth="1" />
      <path d="M10 18v3M14 18v3" stroke="#d4a933" strokeWidth="1" />
    </svg>
  );
}

export function IconBeef({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M8 6c0-1.5 1-3 2-3h4c1 0 2 1.5 2 3v4c0 2-1.5 3.5-3.5 3.5h-2c-2 0-2.5-1.5-2.5-3.5V6z" fill="#c0564b" stroke="#9d3d2a" strokeWidth="1" />
      <path d="M9 8c.5 0 1-.5 1-1M13 8c.5 0 1-.5 1-1M9 12c.5 0 1-.5 1-1M13 12c.5 0 1-.5 1-1M10 15c1 1 2 2 2 4M12 15c1 1 2 2 2 4" stroke="#9d3d2a" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconFish({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 12c0 0 4-4 8-4s8 4 8 4-4 4-8 4-8-4-8-4z" fill="#5fa3d0" stroke="#3d7a9d" strokeWidth="1" />
      <path d="M18 8l4-2v8l-4-2" fill="#5fa3d0" stroke="#3d7a9d" strokeWidth="1" />
      <circle cx="10" cy="12" r="1.5" fill="white" />
    </svg>
  );
}

export function IconShrimp({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 10c2-2 4-3 6-3s4 1 6 3c0 0 1-1 2-1s2 1 2 1M5 12c2 1 4 2 5 4M10 16c2 0 3-2 4-4M6 14l2 4M10 14l2 4" stroke="#e88080" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <circle cx="6" cy="10" r="1" fill="#e88080" />
    </svg>
  );
}

export function IconTofu({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="5" width="14" height="14" rx="2" fill="#e8dcc8" stroke="#c4b5a0" strokeWidth="1" />
      <line x1="5" y1="9" x2="19" y2="9" stroke="#c4b5a0" strokeWidth="0.8" opacity="0.5" />
      <line x1="5" y1="13" x2="19" y2="13" stroke="#c4b5a0" strokeWidth="0.8" opacity="0.5" />
      <line x1="5" y1="17" x2="19" y2="17" stroke="#c4b5a0" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

export function IconEggs({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 8c0-2 1-4 2-5s2-2 3-2 2 1 3 2 2 3 2 5-1 6-2 7-2 2-3 2-2-1-3-2-2-5-2-7z" fill="#f4d9a6" stroke="#d4a960" strokeWidth="1" />
      <path d="M12 6c0 1-.5 2-1 2s-1-1-1-2" stroke="#d4a960" strokeWidth="0.8" opacity="0.6" />
    </svg>
  );
}

export function IconPork({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M8 6c0-1.5 1-3 2-3h4c1 0 2 1.5 2 3v5c0 2-1.5 3.5-3.5 3.5h-2c-2 0-2.5-1.5-2.5-3.5V6z" fill="#d99a9a" stroke="#b07070" strokeWidth="1" />
      <path d="M10 14c0 2 1 3 2 4s1 2 1 2M12 14c0 2 1 3 2 4s1 2 1 2" stroke="#b07070" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlate({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#999" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="12" r="6" stroke="#999" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M8 12c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke={t.accent} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function IconBreakfast({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="8" cy="8" r="3" fill="#f4d9a6" stroke="#d4a960" strokeWidth="1" />
      <circle cx="8" cy="8" r="1.5" fill="#d4a960" opacity="0.5" />
      <path d="M11 8c0-2 1-3 2-3s2 1 2 3-1 3-2 3-2-1-2-3z" fill="#f0c040" stroke="#d4a933" strokeWidth="1" />
      <path d="M5 16h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z" stroke="#999" strokeWidth="1" fill="none" />
    </svg>
  );
}

export function IconSnack({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 8h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" stroke="#999" strokeWidth="1.2" fill="none" />
      <circle cx="9" cy="12" r="1.5" fill={t.accent} />
      <circle cx="15" cy="12" r="1.5" fill={t.accent} />
      <circle cx="12" cy="10" r="1" fill={t.accent} opacity="0.6" />
    </svg>
  );
}

export const PROTEIN_ICONS = {
  Chicken: IconChicken,
  Beef: IconBeef,
  Fish: IconFish,
  Shrimp: IconShrimp,
  Tofu: IconTofu,
  Eggs: IconEggs,
  Pork: IconPork,
  Default: IconPlate,
};

export const PROTEIN_COLORS = {
  Chicken: '#f0c040',
  Beef: '#c0564b',
  Fish: '#5fa3d0',
  Shrimp: '#e88080',
  Tofu: '#e8dcc8',
  Eggs: '#f4d9a6',
  Pork: '#d99a9a',
  Default: '#999',
};

export const SECTION_ICONS = {
  'Batch Breakfast': IconBreakfast,
  'Toddler Snacks': IconSnack,
};
