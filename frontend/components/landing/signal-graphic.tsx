export function SignalGraphic({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 120"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="0,60 60,60 80,20 100,100 120,40 140,60 200,60 220,25 240,95 260,45 280,60 400,60" />
    </svg>
  );
}
