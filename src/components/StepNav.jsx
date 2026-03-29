"use client";
import { t } from '../lib/theme';
import { ChevronIcon } from './Icons';

export default function StepNav({
  onBack,
  onNext,
  onSaveExit,
  nextLabel = 'Continue',
  nextDisabled = false,
  showBack = true,
}) {
  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      justifyContent: 'space-between',
      padding: '20px 0',
      borderTop: `1px solid ${t.border}`,
      marginTop: '32px',
    }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        {showBack && (
          <button
            onClick={onBack}
            style={{
              padding: '10px 16px',
              borderRadius: '6px',
              border: `1px solid ${t.border}`,
              backgroundColor: 'transparent',
              color: t.text,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = t.dim;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ChevronIcon dir="left" size={16} />
            Back
          </button>
        )}
        <button
          onClick={onSaveExit}
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            border: `1px solid ${t.border}`,
            backgroundColor: 'transparent',
            color: t.muted,
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = t.text;
            e.currentTarget.style.backgroundColor = t.dim;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = t.muted;
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Save & exit
        </button>
      </div>

      <button
        onClick={onNext}
        disabled={nextDisabled}
        style={{
          padding: '10px 24px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: nextDisabled ? t.dim : t.accent,
          color: nextDisabled ? t.muted : 'white',
          fontSize: '14px',
          fontWeight: '600',
          cursor: nextDisabled ? 'not-allowed' : 'pointer',
          transition: 'all 150ms',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
        onMouseEnter={(e) => {
          if (!nextDisabled) {
            e.currentTarget.style.opacity = '0.9';
          }
        }}
        onMouseLeave={(e) => {
          if (!nextDisabled) {
            e.currentTarget.style.opacity = '1';
          }
        }}
      >
        {nextLabel}
        <ChevronIcon dir="right" size={16} />
      </button>
    </div>
  );
}
