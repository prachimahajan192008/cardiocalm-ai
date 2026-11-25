import { CheckSquare, ExternalLink, RotateCcw, Square } from 'lucide-react';
import { EVENT_URL } from '../data/challenges';
import type { ChecklistItem } from '../types';

interface ReadinessViewProps {
  checklist: ChecklistItem[];
  onToggleItem: (id: string) => void;
  onResetChecklist: () => void;
}

const PHASES: ChecklistItem['phase'][] = [
  'Before Kickoff',
  'During Sprint',
  'Before Submitting',
];

export function ReadinessView({
  checklist,
  onToggleItem,
  onResetChecklist,
}: ReadinessViewProps) {
  const completedCount = checklist.filter((c) => c.completed).length;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">
            Hack2Skill Registration & Sprint Readiness
          </h2>
          <p className="text-sm text-slate-600">
            Track your manual Hack2Skill sign-up and pre-kickoff preparation steps. Progress:{' '}
            <span className="font-semibold text-slate-900 tabular-nums">
              {completedCount} of {checklist.length}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onResetChecklist}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <a
            href={EVENT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 whitespace-nowrap shrink-0"
          >
            Register on Hack2Skill
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="space-y-6">
        {PHASES.map((phase) => {
          const items = checklist.filter((item) => item.phase === phase);
          return (
            <div
              key={phase}
              className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100"
            >
              <div className="px-6 py-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{phase}</h3>
                <span className="text-xs text-slate-500 tabular-nums">
                  {items.filter((i) => i.completed).length} / {items.length}
                </span>
              </div>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggleItem(item.id)}
                  className="w-full text-left px-6 py-4 flex items-start gap-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {item.completed ? (
                    <CheckSquare className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div
                      className={`text-sm font-medium ${
                        item.completed
                          ? 'line-through text-slate-400'
                          : 'text-slate-900'
                      }`}
                    >
                      {item.label}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
