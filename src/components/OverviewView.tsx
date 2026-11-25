import { ArrowRight, ExternalLink } from 'lucide-react';
import { CARDIAC_PROBLEM_STATEMENT, EVENT_URL } from '../data/challenges';
import type {
  ChallengeScenario,
  ChecklistItem,
  PromptRevision,
  WorkspaceTab,
} from '../types';
import { ResilientImage } from './ResilientImage';

interface OverviewViewProps {
  scenarios: ChallengeScenario[];
  checklist: ChecklistItem[];
  revisions: PromptRevision[];
  hasSubmissionDraft: boolean;
  onSelectScenario: (scenarioId: string) => void;
  onNavigate: (tab: WorkspaceTab) => void;
}

const PILLAR_CARDS = [
  {
    index: '01.',
    title: 'Early Cardiac Risk Prediction',
    subtitle: 'Wearable vitals + symptom triage',
    description:
      'Monitors heart rate spikes, HRV (RMSSD) drops, blood pressure surges, SpO2 dips, and chest/respiratory symptoms to classify risk into Nominal, Elevated, or High Alert before crisis escalation.',
    image: '/src/assets/images/hero_cardiac_wearable_1795628327398.jpg',
    alt: 'Matte titanium smartwatch displaying a subtle teal heart rate waveform on limestone',
    cta: 'Test Risk Triage',
  },
  {
    index: '02.',
    title: 'Calm Patient De-escalation',
    subtitle: '4-7-8 pacer + grounding companion',
    description:
      'Pairs a visual 4-7-8 breathing pacer with short, non-alarmist Gemini dialogue tuned to live vitals—reducing panic-driven heart rate elevation while keeping the patient seated and oriented.',
    image: '/src/assets/images/calming_breath_sanctuary_1795628328357.jpg',
    alt: 'Quiet architectural corner in soft morning daylight with ceramic vessel and eucalyptus',
    cta: 'Open Breathing Guide',
  },
  {
    index: '03.',
    title: 'Coordinated Emergency Handoff',
    subtitle: 'EMS script + family alert packet',
    description:
      'Generates a structured paramedic dispatcher script, a calm family SMS alert with location and access notes, and an actionable responder-readiness checklist in one click.',
    image: '/src/assets/images/emergency_dispatch_console_1795628328870.jpg',
    alt: 'Matte medical dispatch console showing route and vital sign lines on dark slate',
    cta: 'Preview Dispatch Brief',
  },
];

export function OverviewView({
  scenarios,
  checklist,
  revisions,
  hasSubmissionDraft,
  onSelectScenario,
  onNavigate,
}: OverviewViewProps) {
  const completedCount = checklist.filter((item) => item.completed).length;

  return (
    <div className="space-y-14">
      {/* Editorial Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-10 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="text-xs font-medium text-teal-700">
              PromptWars X AI Vibeathon 2026 <span aria-hidden="true">·</span> 25 November 2026
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#0B1320] leading-[1.1] [text-wrap:balance]">
              Predict cardiac risk early. Calm the moment. Coordinate help fast.
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              {CARDIAC_PROBLEM_STATEMENT}. Built as an interactive three-pillar health agent and complete Hack2Skill prompt engineering submission.
            </p>
          </div>

          <div className="pt-8 mt-8 border-t border-slate-100 space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('agent')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-teal-700 rounded-xl hover:bg-teal-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Launch CardioCalm Agent
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('submission')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-slate-800 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Review Submission Pack
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>Register with your personal account on Hack2Skill before submitting.</span>
              <a
                href={EVENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-teal-700 hover:text-teal-800 whitespace-nowrap"
              >
                Hack2Skill Event Page
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-slate-200/80 min-h-[340px] lg:min-h-[460px]">
          <ResilientImage
            src="/src/assets/images/hero_cardiac_wearable_1795628327398.jpg"
            alt="Wearable cardiac telemetry smartwatch resting on cool limestone"
            className="w-full h-full lg:h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1320]/90 via-[#0B1320]/30 to-transparent" />

          <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 text-white space-y-3">
            <div className="text-xs font-medium text-teal-300">
              Continuous Biometric Triage Preview
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/15">
              <div>
                <div className="text-[11px] text-slate-300">Heart Rate</div>
                <div className="text-xl font-mono font-semibold tabular-nums">
                  84 <span className="text-xs font-normal text-slate-300">bpm</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-300">HRV RMSSD</div>
                <div className="text-xl font-mono font-semibold tabular-nums">
                  48 <span className="text-xs font-normal text-slate-300">ms</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-300">Oxygen SpO2</div>
                <div className="text-xl font-mono font-semibold tabular-nums">
                  98<span className="text-xs font-normal text-slate-300">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column Full-Width Summary Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-5">
          <div className="text-xs text-slate-500">Challenge Date</div>
          <div className="mt-1.5 text-lg font-semibold text-slate-900 tabular-nums">
            25 Nov 2026
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-5">
          <div className="text-xs text-slate-500">Readiness Checklist</div>
          <div className="mt-1.5 text-lg font-semibold text-slate-900 tabular-nums">
            {completedCount} / {checklist.length} done
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-5">
          <div className="text-xs text-slate-500">Prompt Runs Tested</div>
          <div className="mt-1.5 text-lg font-semibold text-slate-900 tabular-nums">
            {revisions.length}
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-5">
          <div className="text-xs text-slate-500">Hack2Skill Entry</div>
          <div className="mt-1.5 text-lg font-semibold text-slate-900">
            {hasSubmissionDraft ? 'Pre-Staged' : 'Drafting'}
          </div>
        </div>
      </section>

      {/* 3-Pillar Architecture Showcase */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-semibold text-[#0B1320] font-editorial">
              Three Coordinated Care Pillars
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Every module inside the live agent is backed by a structured Gemini 4 Hydrogen prompt contract.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('agent')}
            className="text-sm font-medium text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Open interactive simulator →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PILLAR_CARDS.map((pillar) => (
            <article
              key={pillar.index}
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col justify-between group"
            >
              <div>
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  <ResilientImage
                    src={pillar.image}
                    alt={pillar.alt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-6 space-y-2.5">
                  <div className="text-xs text-slate-500">
                    {pillar.index} {pillar.subtitle}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onNavigate('agent')}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800 cursor-pointer"
                >
                  {pillar.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Prompt Engineering Drills */}
      <section className="space-y-5 pt-2 border-t border-slate-200">
        <div>
          <h2 className="text-xl font-semibold text-[#0B1320]">
            Prompt Engineering Workbench & Practice Drills
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Inspect or iterate on the official CardioCalm system prompt, or sharpen edge-case handling with secondary drills.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="bg-white border border-slate-200/80 rounded-xl p-6 flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div className="space-y-2.5">
                <div className="text-xs text-slate-500">
                  {scenario.category} <span aria-hidden="true">·</span> {scenario.difficulty}{' '}
                  <span aria-hidden="true">·</span>{' '}
                  <span className="tabular-nums">{scenario.timeboxMinutes} min</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  {scenario.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {scenario.brief}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 tabular-nums">
                  {scenario.constraints.length} constraints
                </span>
                <button
                  type="button"
                  onClick={() => onSelectScenario(scenario.id)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Open in Prompt Lab
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
