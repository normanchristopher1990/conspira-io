import { useI18n } from '../lib/i18n';

type Props = {
  score: number; // 1..9
};

const POSITION_COLOR: Record<number, string> = {
  1: '#FF0000',
  2: '#F45B2D',
  3: '#F97316',
  4: '#F59E0B',
  5: '#EAB308',
  6: '#84CC16',
  7: '#22C55E',
  8: '#16A34A',
  9: '#15803D',
};

export default function ScoreBar({ score }: Props) {
  const { t } = useI18n();
  const clamped = Math.max(1, Math.min(9, Math.round(score)));
  const accent = POSITION_COLOR[clamped];

  const label =
    clamped <= 2
      ? t.score.almostFalse
      : clamped <= 4
        ? t.score.likelyFalse
        : clamped === 5
          ? t.score.undetermined
          : clamped <= 7
            ? t.score.likelyTrue
            : t.score.almostTrue;

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-1">
          <span className="font-mono-num text-2xl font-bold leading-none" style={{ color: accent }}>
            {clamped}
          </span>
          <span className="font-mono-num text-xs text-muted">/9</span>
        </div>
        <span className="text-xs text-muted">{label}</span>
      </div>

      <div className="mt-2 grid grid-cols-9 gap-[3px]" aria-label={t.score.scoreOfNine(clamped)}>
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
