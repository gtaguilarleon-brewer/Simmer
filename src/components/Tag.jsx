"use client";
import { t } from '../lib/theme';

export default function Tag({ label, variant = 'default', onRemove }) {
  const variants = {
    default: {
      bg: t.dim,
      text: t.text,
      border: t.border,
    },
    accent: {
      bg: t.accentDim,
      text: t.accent,
      border: t.accent,
    },
    new: {
      bg: '#e8f5e9',
      text: '#2e7d32',
      border: '#c8e6c9',
    },
    frequency: {
      bg: '#fff3e0',
      text: '#e65100',
      border: '#ffe0b2',
    },
  };

  const style = variants[variant] || variants.default;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '16px',
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        fontSize: '13px',
        fontWeight: '500',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '0 2px',
            cursor: 'pointer',
            color: 'inherit',
            fontSize: '16px',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
