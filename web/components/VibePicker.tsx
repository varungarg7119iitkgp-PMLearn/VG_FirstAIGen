type VibeOption = {
  id: string;
  label: string;
  emoji: string;
};

const VIBES: VibeOption[] = [
  { id: "party", label: "Party", emoji: "💃" },
  { id: "romantic", label: "Romantic", emoji: "🕯️" },
  { id: "solo", label: "Solo Peace", emoji: "📚" },
  { id: "catchup", label: "Quick Catchup", emoji: "👥" }
];

export type VibePickerProps = {
  value: string;
  onChange: (vibeId: string) => void;
};

export function VibePicker({ value, onChange }: VibePickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-200">
        Choose your vibe <span className="text-gourmetGold">✨</span>
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {VIBES.map((vibe) => {
          const isActive = vibe.id === value;
          return (
            <button
              key={vibe.id}
              type="button"
              onClick={() => onChange(vibe.id)}
              className={`glass-card flex flex-col items-center justify-center gap-1 px-3 py-3 text-xs font-medium transition-transform hover:scale-105 ${
                isActive
                  ? "border-2 border-zomatoRed bg-zomatoRed text-white shadow-soft-red ring-2 ring-zomatoRed/60"
                  : "border border-white/10 text-slate-100 hover:border-zomatoRed/60"
              }`}
            >
              <span className="text-lg">{vibe.emoji}</span>
              <span>{vibe.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

