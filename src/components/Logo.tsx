export default function Logo({ size = 28, white = false }: { size?: number; white?: boolean }) {
  const ink = white ? "#ffffff" : "#3347e0";
  const paper = white ? "#3347e0" : "#ffffff";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className="pixel-snap">
      {/* pixel shield */}
      <path
        d="M16 2 28 7v8c0 7.5-5 13.5-12 15.5C9 28.5 4 22.5 4 15V7l12-5Z"
        fill={ink}
      />
      {/* transaction arrow carved out */}
      <path
        d="M10 15h8v-3l6 5-6 5v-3h-8v-4Z"
        fill={paper}
      />
    </svg>
  );
}
