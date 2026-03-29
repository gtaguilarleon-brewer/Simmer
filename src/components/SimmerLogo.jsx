"use client";
import { t } from '../lib/theme';

export default function SimmerLogo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="9" y="12" width="22" height="12" rx="3.5" stroke={t.muted} strokeWidth="1.6" />
      <path d="M7 12h26" stroke={t.muted} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 14H5" stroke={t.muted} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M33 14h2" stroke={t.muted} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16 8c0-1.5.5-2.5 0-4" stroke={t.muted} strokeWidth="1" strokeLinecap="round" opacity="0.3">
        <animate attributeName="opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite" />
      </path>
      <path d="M20 7c0-1.5.5-2.5 0-4.5" stroke={t.accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.5">
        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2.5s" repeatCount="indefinite" />
      </path>
      <path d="M24 8c0-1.5.5-2.5 0-4" stroke={t.muted} strokeWidth="1" strokeLinecap="round" opacity="0.3">
        <animate attributeName="opacity" values="0.15;0.35;0.15" dur="3.5s" repeatCount="indefinite" />
      </path>
      <path d="M20 36c-3 0-5-2.5-5-5.5 0-4 3-6 5-8 2 2 5 4 5 8 0 3-2 5.5-5 5.5z" fill={t.accentDim} stroke={t.accent} strokeWidth="1.2" />
      <path d="M20 36c-1.5 0-2.5-1.2-2.5-3 0-2 1.5-3.5 2.5-4.5 1 1 2.5 2.5 2.5 4.5 0 1.8-1 3-2.5 3z" fill={t.accent} opacity="0.35" />
    </svg>
  );
}
