import { SparkleIcon } from './icons';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Block = {
  day: number;
  row: number;
  span: number;
  label: string;
  time: string;
  tone: 'yellow' | 'blue' | 'outline';
};

const BLOCKS: Block[] = [
  { day: 0, row: 1, span: 2, label: 'J. Rivera', time: '9a–2p', tone: 'yellow' },
  { day: 1, row: 2, span: 2, label: 'M. Chen', time: '11a–4p', tone: 'blue' },
  { day: 2, row: 1, span: 1, label: 'You', time: '8a–12p', tone: 'yellow' },
  { day: 3, row: 3, span: 2, label: 'D. Osei', time: '2p–8p', tone: 'blue' },
  { day: 4, row: 1, span: 2, label: 'You', time: '9a–3p', tone: 'yellow' },
  { day: 5, row: 2, span: 1, label: 'Open', time: '4p–9p', tone: 'outline' },
];

const toneClasses: Record<Block['tone'], string> = {
  yellow: 'bg-yellow-400 text-navy-950 border-yellow-500/40',
  blue: 'bg-navy-700 text-ink-100 border-navy-600',
  outline: 'border-dashed border-ink-500/50 text-ink-500 bg-transparent',
};

export default function ScheduleMockup() {
  return (
    <div className="relative">
      <div className="absolute -top-4 right-6 z-10 flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-navy-900 px-3 py-1.5 text-xs font-medium text-yellow-300 shadow-lg shadow-black/30">
        <SparkleIcon className="h-3.5 w-3.5" />
        Extracted from a photo in seconds
      </div>

      <div className="rounded-2xl border border-navy-700 bg-navy-900 p-4 shadow-2xl shadow-black/40 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-ink-100">This week</span>
            <span className="text-xs text-ink-500">Mar 9 – Mar 15</span>
          </div>
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-navy-600" />
            <span className="h-2 w-2 rounded-full bg-navy-600" />
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-[10px] font-medium uppercase tracking-wide text-ink-500 sm:text-xs"
            >
              {day}
            </div>
          ))}

          {DAYS.map((_, dayIndex) => (
            <div
              key={dayIndex}
              className="grid grid-rows-4 gap-1.5 rounded-lg bg-navy-950/60 p-1 sm:gap-2 sm:p-1.5"
              style={{ minHeight: '9.5rem' }}
            >
              {BLOCKS.filter((b) => b.day === dayIndex).map((b, i) => (
                <div
                  key={i}
                  className={`flex flex-col justify-center rounded-md border px-1.5 py-1 text-[9px] leading-tight font-medium sm:text-[11px] ${toneClasses[b.tone]}`}
                  style={{ gridRow: `${b.row} / span ${b.span}` }}
                >
                  <span className="truncate">{b.label}</span>
                  <span className="truncate opacity-80">{b.time}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
