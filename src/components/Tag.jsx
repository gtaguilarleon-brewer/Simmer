"use client";
import { t } from '../lib/theme';

export default function Tag({ label, variant = 'default', onRemove, children }) {
  const variants = {
    default: {
      bg: "rgba(92,85,72,0.25)",
      text: t.muted,
      border: "transparent",
    },
    accent: {
      bg: t.accentDim,
      text: t.accent,
      border: "transparent",
    },
    new: {
      bg: t.greenDim,
      text: t.green,
      border: "transparent",
    },
    frequency: {
      bg: t.accentDim,
      text: t.accent,
      border: "transparent",
    },
    muted: {
      bg: "transparent",
      text: t.subtle,
      border: t.border,
    },
  };

  const style = variants[variant] || variants.default;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 9px',
        borderRadius: '6px',
        backgroundColor: style.bg,
        color: style.text,
        border: style.border !== "transparent" ? `1px solid ${style.border}` : "none",
        fontSize: '12px',
        fontWeight: '500',
        whiteSpace: 'nowrap',
        fontFamily: t.sans,
        lineHeight: '1.4',
      }}
    >
      {label || children}
      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '0 1px',
            cursor: 'pointer',
            color: 'inherit',
            fontSize: '14px',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 150ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          ×
        </button>
      )}
    </span>
  );
}
