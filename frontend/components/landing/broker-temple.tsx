// Ilustración de la landing: un templo griego donde el broker MQTT (el punto
// ámbar del frontón) reparte los mensajes a las columnas, que representan a
// los dispositivos / organizaciones. El color de las columnas es currentColor.
export function BrokerTemple({ className }: { className?: string }) {
  const columns = [22, 46, 74, 98];

  return (
    <svg
      viewBox="0 0 120 108"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M10 38L60 12L110 38Z"
        stroke="#E2A33D"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {columns.map((x) => (
        <path
          key={`signal-${x}`}
          d={`M60 12L${x} 46`}
          stroke="#E2A33D"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ))}
      <path
        d="M10 46H110M10 96H110"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {columns.map((x) => (
        <path
          key={`column-${x}`}
          d={`M${x} 46V96`}
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      ))}
      <circle cx="60" cy="12" r="6" fill="#E2A33D" />
    </svg>
  );
}
