"use client";
import { t } from '../lib/theme';

export default function StepHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h1 style={{
        margin: '0 0 8px 0',
        fontSize: '28px',
        fontWeight: '700',
        color: t.text,
        letterSpacing: '-0.5px',
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: t.muted,
          lineHeight: '1.5',
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
