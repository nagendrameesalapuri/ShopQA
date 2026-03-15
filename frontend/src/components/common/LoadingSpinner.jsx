// LoadingSpinner.jsx
import React from 'react';
export function LoadingSpinner({ fullPage, size = 'lg' }) {
  if (fullPage) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }} data-testid="loading-spinner">
      <div className={`spinner spinner-${size}`} />
    </div>
  );
  return <div className={`spinner spinner-${size}`} data-testid="loading-spinner" />;
}
export default LoadingSpinner;
