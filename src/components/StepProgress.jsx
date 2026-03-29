"use client";
import { t } from '../lib/theme';

export default function StepProgress({ currentStep, totalSteps, stepLabels = [] }) {
  const progress = ((currentStep) / totalSteps) * 100;

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
      }}>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const isActive = i < currentStep;
          const isCurrent = i === currentStep - 1;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                backgroundColor: isActive ? t.accent : isCurrent ? t.accent : t.dim,
                transition: 'background-color 300ms',
              }}
            />
          );
        })}
      </div>

      {stepLabels.length > 0 && (
        <div style={{
          fontSize: '12px',
          color: t.muted,
          textAlign: 'center',
        }}>
          {stepLabels[currentStep - 1] && (
            <>
              <span style={{ fontWeight: '500', color: t.text }}>
                {stepLabels[currentStep - 1]}
              </span>
              {' '}
              <span>Step {currentStep} of {totalSteps}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
