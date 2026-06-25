// Decorative organic blob / leaf accents (pure SVG, no deps). Place absolutely.

export function Blob({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M44.7,-58.1C57.4,-49.3,66.5,-35.2,69.8,-19.9C73.1,-4.6,70.6,11.9,63.4,25.7C56.2,39.5,44.3,50.6,30.6,57.8C16.9,65,1.4,68.3,-14.8,67.2C-31,66.1,-47.9,60.6,-58.6,49.2C-69.3,37.8,-73.8,20.5,-73.6,3.4C-73.4,-13.7,-68.5,-30.6,-58.1,-40.9C-47.7,-51.2,-31.8,-54.9,-16.8,-62.4C-1.8,-69.9,12.3,-81.2,25.6,-78.6C38.9,-76,51.9,-66.9,44.7,-58.1Z"
        transform="translate(100 100)"
      />
    </svg>
  );
}

export function Frond({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden>
      <path d="M60 110C60 70 64 30 96 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {[26, 42, 58, 74, 90].map((y, i) => (
        <path key={y} d={`M${60 + i * 7} ${y} q14 -10 24 -4`} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      ))}
      {[26, 42, 58, 74, 90].map((y, i) => (
        <path key={`l${y}`} d={`M${60 + i * 7} ${y} q-14 -10 -24 -4`} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      ))}
    </svg>
  );
}
