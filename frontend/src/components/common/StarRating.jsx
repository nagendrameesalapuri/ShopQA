// StarRating.jsx
import React from 'react';
export default function StarRating({ rating, size = 'md', interactive = false, onChange }) {
  const sizes = { sm: '14px', md: '18px', lg: '24px' };
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = i < Math.floor(rating);
    const half   = !filled && i < rating;
    return (
      <span
        key={i}
        className={`star ${filled ? 'filled' : half ? 'half' : ''}`}
        style={{ fontSize: sizes[size], cursor: interactive ? 'pointer' : 'default' }}
        onClick={() => interactive && onChange && onChange(i + 1)}
        data-testid={`star-${i + 1}`}
        role={interactive ? 'button' : undefined}
        aria-label={interactive ? `Rate ${i + 1} stars` : undefined}
      >
        {filled || half ? '★' : '☆'}
      </span>
    );
  });
  return <div className="stars" role="img" aria-label={`${rating} out of 5 stars`} data-testid="star-rating">{stars}</div>;
}
