"use client";
import { t } from '../lib/theme';

export function GroceryBagIllustration({ size = 64 }) {
  const scale = size / 64;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1" />
        </filter>
      </defs>
      <path d="M20 16h24a2 2 0 0 1 2 2v32a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V18a2 2 0 0 1 2-2z" stroke={t.muted} strokeWidth="1.5" fill="none" filter="url(#shadow)" />
      <path d="M28 16v-4a4 4 0 0 1 8 0v4" stroke={t.muted} strokeWidth="1.5" />
      <circle cx="28" cy="26" r="3" fill={t.accentDim} opacity="0.5" />
      <circle cx="36" cy="28" r="2.5" fill={t.accentDim} opacity="0.4" />
      <circle cx="44" cy="26" r="3" fill={t.accentDim} opacity="0.5" />
      <circle cx="32" cy="36" r="2" fill={t.accent} opacity="0.6" />
      <circle cx="40" cy="38" r="2.5" fill={t.accent} opacity="0.5" />
    </svg>
  );
}

export function AllDoneIllustration({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="20" stroke={t.muted} strokeWidth="1.5" opacity="0.3" />
      <circle cx="24" cy="24" r="15" stroke={t.muted} strokeWidth="1.5" opacity="0.5" />
      <circle cx="24" cy="24" r="10" stroke={t.accent} strokeWidth="2" fill={t.accentDim} opacity="0.2" />
      <path d="M19 24l3 3 6-6" stroke={t.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RecipeBookIllustration({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <filter id="bookShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1" />
        </filter>
      </defs>
      <path d="M16 12h32v40H16z" stroke={t.muted} strokeWidth="1.5" fill="none" filter="url(#bookShadow)" />
      <path d="M16 12v40" stroke={t.muted} strokeWidth="1.5" />
      <path d="M32 16v32" stroke={t.muted} strokeWidth="1" opacity="0.4" />
      <line x1="20" y1="20" x2="28" y2="20" stroke={t.muted} strokeWidth="1" />
      <line x1="20" y1="24" x2="28" y2="24" stroke={t.muted} strokeWidth="1" opacity="0.5" />
      <line x1="20" y1="28" x2="28" y2="28" stroke={t.muted} strokeWidth="1" opacity="0.5" />
      <circle cx="36" cy="24" r="3" fill={t.accent} opacity="0.6" />
      <path d="M36 30l1.5 2.5L40 32" stroke={t.accent} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="44" cy="28" r="2" fill={t.accentDim} opacity="0.4" />
    </svg>
  );
}

export function CookingPotIllustration({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <filter id="potShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1" />
        </filter>
      </defs>
      <ellipse cx="32" cy="40" rx="16" ry="12" stroke={t.muted} strokeWidth="1.5" fill="none" filter="url(#potShadow)" />
      <path d="M16 40h32" stroke={t.muted} strokeWidth="1.5" />
      <path d="M14 38v2" stroke={t.muted} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M50 38v2" stroke={t.muted} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M24 24c0-2 1-4 2-5" stroke={t.accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
      </path>
      <path d="M32 22c0-2.5 1.5-4.5 2.5-5.5" stroke={t.accent} strokeWidth="1.4" strokeLinecap="round" opacity="0.5">
        <animate attributeName="opacity" values="0.2;0.8;0.2" dur="1.8s" repeatCount="indefinite" />
      </path>
      <path d="M40 24c0-2 1-4 2-5" stroke={t.accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.5">
        <animate attributeName="opacity" values="0.4;0.6;0.4" dur="2.2s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

export function EmptyBowlIllustration({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <filter id="bowlShadow">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.1" />
        </filter>
      </defs>
      <path d="M8 18c0 8 6.5 12 12 12s12-4 12-12" stroke="#999" strokeWidth="1.2" fill="none" filter="url(#bowlShadow)" />
      <path d="M8 18h24" stroke="#999" strokeWidth="1.2" />
      <path d="M14 14c0-1.5 1-2.5 2-3" stroke={t.accent} strokeWidth="0.8" strokeLinecap="round" opacity="0.5">
        <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
      </path>
      <path d="M20 12c0-2 1-3.5 2-4.5" stroke={t.accent} strokeWidth="1" strokeLinecap="round" opacity="0.4">
        <animate attributeName="opacity" values="0.1;0.7;0.1" dur="1.8s" repeatCount="indefinite" />
      </path>
      <path d="M26 14c0-1.5 1-2.5 2-3" stroke={t.accent} strokeWidth="0.8" strokeLinecap="round" opacity="0.5">
        <animate attributeName="opacity" values="0.3;0.5;0.3" dur="2.2s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

export function IconEssentials({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 4h4v16H4zM10 6h4v14h-4zM16 3h4v17h-4z" stroke="#999" strokeWidth="1" fill="none" />
      <circle cx="12" cy="8" r="1.5" fill={t.accent} />
    </svg>
  );
}

export function IconNiceToHaves({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#999" strokeWidth="1" fill="none" />
      <circle cx="12" cy="10" r="2" fill={t.accent} />
    </svg>
  );
}

export function IconEasyMeals({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#999" strokeWidth="1" fill="none" />
      <path d="M12 8v8M8 12h8" stroke="#999" strokeWidth="1" strokeLinecap="round" />
      <circle cx="14" cy="10" r="1.5" fill={t.accent} />
    </svg>
  );
}

export function IconPantry({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="#999" strokeWidth="1" fill="none" />
      <rect x="9" y="10" width="6" height="3" stroke="#999" strokeWidth="0.8" fill="none" />
      <rect x="10" y="10.5" width="4" height="2" fill={t.accent} opacity="0.6" />
    </svg>
  );
}
