type Props = {
  score: number; // 1..9
};

type RGB = [number, number, number];
const RED: RGB = [192, 57, 43];     // #C0392B — score 1
const GREY: RGB = [156, 163, 175];  // #9CA3AF — score 5
const GREEN: RGB = [31, 138, 76];   // #1F8A4C — score 9

function lerp(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function rgb([r, g, b]: RGB): string {
  return `rgb(${r}, ${g}, ${b})`;
}

// Smooth two-stop gradient: red → grey at score 5 → green.
// Each of the 9 positions gets a unique colour.
function colorAtPosition(n: number): string {
  if (n <= 5) return rgb(lerp(RED, GREY, (n - 1) / 4));
  return rgb(lerp(GREY, GREEN, (n - 5) / 4));
}

function labelFor(score: number): string {
  if (score <= 2) return 'Almost certainly false';
  if (score <= 4) return 'Likely false';
  if (score === 5) return 'Undetermined';
  if (score <= 7) return 'Likely true';
  return 'Almost certainly true';
}

export default function ScoreBar({ score }: Props) {
  const clamped = Math.max(1, Math.min(9, Math.round(score)));
  const accent = colorAtPosition(clamped);

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
          const cellColor = colorAtPosition(n);
          return (
            <div
              key={n}
              className="h-2 rounded-sm transition-all"
              style={{
                backgroundColor: cellColor,
                opacity: isActive ? 1 : 0.45,
                boxShadow: isActive ? `0 0 0 2px ${accent}33` : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
