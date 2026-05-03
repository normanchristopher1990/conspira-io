type Props = {
  score: number; // 1..9
};

// Each position has its own colour along the red → orange → yellow → green
// spectrum. Only the active box ever displays it; the rest stay grey.
const POSITION_COLOR: Record<number, string> = {
  1: '#FF0000', // YouTube red
  2: '#F45B2D', // red-orange
  3: '#F97316', // orange
  4: '#F59E0B', // amber / dark orange
  5: '#EAB308', // yellow
  6: '#84CC16', // lime
  7: '#22C55E', // green
  8: '#16A34A', // dark-medium green
  9: '#15803D', // deep green
};

function labelFor(score: number): string {
  if (score <= 2) return 'Almost certainly false';
  if (score <= 4) return 'Likely false';
  if (score === 5) return 'Undetermined';
  if (score <= 7) return 'Likely true';
  return 'Almost certainly true';
}

export default function ScoreBar({ score }: Props) {
  const clamped = Math.max(1, Math.min(9, Math.round(score)));
  const accent = POSITION_COLOR[clamped];

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-1">
          <span className="font-mono-num text-2xl font-bold leading-none" style={{ color: accent }}>
            {clamped}
          </span>
          <span className="font-mono-num text-xs text-muted">/9</span>
        </div>
        <span className="text-xs text-muted">{labelFor(clamped)}</span>
      </div>

      <div className="mt-2 grid grid-cols-9 gap-[3px]" aria-label={`Score ${clamped} of 9`}>
        {Array.from({ length: 9 }, (_, i) => {
          const n = i + 1;
          const isActive = n === clamped;
          return (
            <div
              key={n}
              className="h-2 rounded-sm transition-all"
              style={{
                backgroundColor: isActive ? accent : '#E2E8F0',
                boxShadow: isActive ? `0 0 0 2px ${accent}33` : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
