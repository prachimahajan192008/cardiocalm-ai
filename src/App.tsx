import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AgentDemoView } from './components/AgentDemoView';
import { OverviewView } from './components/OverviewView';
import { PromptLabView } from './components/PromptLabView';
import { ReadinessView } from './components/ReadinessView';
import { ResilientImage } from './components/ResilientImage';
import { SubmissionView } from './components/SubmissionView';
import {
  CHALLENGE_SCENARIOS,
  DEFAULT_CHECKLIST,
  DEFAULT_SUBMISSION,
  EVENT_URL,
} from './data/challenges';
import type {
  ChecklistItem,
  PromptRevision,
  SubmissionDraft,
  WorkspaceTab,
} from './types';

const STORAGE_KEYS = {
  revisions: 'promptwars_revisions_v1',
  submission: 'promptwars_submission_v2',
  checklist: 'promptwars_checklist_v2',
};

function buildSubmissionMarkdown(draft: SubmissionDraft): string {
  return `# ${draft.projectTitle || 'PromptWars 2026 Submission'}

**Event:** PromptWars – AI Prompt Challenge (25 November 2026)
**Participant:** ${draft.participantName || 'Not set'} (${draft.participantEmail || 'Not set'})
**Hack2Skill Handle:** ${draft.hack2skillHandle || 'Pending registration'}
**AI Tools Used:** ${draft.toolsUsed || 'Google AI Studio, Gemini 4 Hydrogen'}

## Problem Statement
${draft.problemStatement || '_Paste the assigned kickoff problem statement here._'}

## Prompt Strategy & Reasoning
${draft.strategyRationale || '_Document how you decomposed constraints, structured instructions, and validated edge cases._'}

## Final System Instruction
\`\`\`text
${draft.finalSystemPrompt || '(None)'}
\`\`\`

## Final User Prompt
\`\`\`text
${draft.finalUserPrompt || '(None)'}
\`\`\`

## Verified Output
\`\`\`text
${draft.verifiedOutput || '(Run a prompt in Prompt Lab or sync from Agent Demo)'}
\`\`\`

## Demo & Implementation Notes
${draft.demoNotes || '_Add repository or live preview link if applicable._'}
`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    CHALLENGE_SCENARIOS[0].id
  );

  const [revisions, setRevisions] = useState<PromptRevision[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.revisions);
      return saved ? (JSON.parse(saved) as PromptRevision[]) : [];
    } catch {
      return [];
    }
  });

  const [submission, setSubmission] = useState<SubmissionDraft>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.submission);
      return saved ? (JSON.parse(saved) as SubmissionDraft) : DEFAULT_SUBMISSION;
    } catch {
      return DEFAULT_SUBMISSION;
    }
  });

  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.checklist);
      return saved ? (JSON.parse(saved) as ChecklistItem[]) : DEFAULT_CHECKLIST;
    } catch {
      return DEFAULT_CHECKLIST;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.revisions, JSON.stringify(revisions));
    } catch {
      // Ignore storage quota errors
    }
  }, [revisions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.submission, JSON.stringify(submission));
    } catch {
      // Ignore storage quota errors
    }
  }, [submission]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(checklist));
    } catch {
      // Ignore storage quota errors
    }
  }, [checklist]);

  const handleSelectScenarioFromOverview = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setActiveTab('lab');
  };

  const handleAddRevision = (rev: PromptRevision) => {
    setRevisions((prev) => [rev, ...prev].slice(0, 30));
  };

  const handleSendToSubmission = (payload: {
    problemStatement: string;
    systemPrompt: string;
    userPrompt: string;
    output: string;
  }) => {
    setSubmission((prev) => ({
      ...prev,
      problemStatement: payload.problemStatement || prev.problemStatement,
      finalSystemPrompt: payload.systemPrompt,
      finalUserPrompt: payload.userPrompt,
      verifiedOutput: payload.output || prev.verifiedOutput,
      updatedAt: new Date().toLocaleString(),
    }));
  };

  const handleSyncDemoToSubmission = (summaryText: string) => {
    setSubmission((prev) => ({
      ...prev,
      verifiedOutput: summaryText,
      updatedAt: new Date().toLocaleString(),
    }));
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleExportSubmission = () => {
    const markdown = buildSubmissionMarkdown(submission);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'promptwars-submission.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasSubmissionDraft = Boolean(
    submission.projectTitle.trim() ||
      submission.strategyRationale.trim() ||
      submission.finalUserPrompt.trim()
  );

  const navItems: { id: WorkspaceTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'agent', label: 'Agent Demo' },
    { id: 'lab', label: 'Prompt Lab' },
    { id: 'submission', label: 'Submission' },
    { id: 'readiness', label: 'Readiness' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8] text-[#0B1320]">
      {/* 3-Zone Top Bar Contract */}
      <header className="bg-white/95 backdrop-blur border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className="inline-flex items-center gap-2.5 text-xl font-editorial font-semibold tracking-tight text-[#0B1320] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ResilientImage
              src="/src/assets/images/cardiocalm_logo_mark_1795628518643.jpg"
              alt="CardioCalm logo"
              className="w-8 h-8 rounded-lg object-cover shrink-0"
            />
            <span>CardioCalm</span>
          </button>

          <nav
            aria-label="Primary workspace navigation"
            className="flex items-center gap-6 overflow-x-auto"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'border-teal-700 text-[#0B1320]'
                      : 'border-transparent text-slate-600 hover:text-[#0B1320]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleExportSubmission}
              className="px-4 py-2 text-xs font-medium text-white bg-[#0B1320] rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Export Submission
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'overview' && (
              <OverviewView
                scenarios={CHALLENGE_SCENARIOS}
                checklist={checklist}
                revisions={revisions}
                hasSubmissionDraft={hasSubmissionDraft}
                onSelectScenario={handleSelectScenarioFromOverview}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'agent' && (
              <AgentDemoView onSyncToSubmission={handleSyncDemoToSubmission} />
            )}

            {activeTab === 'lab' && (
              <PromptLabView
                scenarios={CHALLENGE_SCENARIOS}
                selectedScenarioId={selectedScenarioId}
                onSelectScenario={setSelectedScenarioId}
                revisions={revisions}
                onAddRevision={handleAddRevision}
                onSendToSubmission={handleSendToSubmission}
              />
            )}

            {activeTab === 'submission' && (
              <SubmissionView
                draft={submission}
                onChange={setSubmission}
                onBuildMarkdown={buildSubmissionMarkdown}
              />
            )}

            {activeTab === 'readiness' && (
              <ReadinessView
                checklist={checklist}
                onToggleItem={handleToggleChecklist}
                onResetChecklist={() => setChecklist(DEFAULT_CHECKLIST)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-slate-200/80 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="inline-flex items-center gap-2.5">
            <ResilientImage
              src="/src/assets/images/cardiocalm_logo_mark_1795628518643.jpg"
              alt="CardioCalm logo"
              className="w-5 h-5 rounded object-cover shrink-0"
            />
            <span>CardioCalm · PromptWars X AI Vibeathon 2026</span>
          </div>
          <a
            href={EVENT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-800 underline underline-offset-2"
          >
            Official Hack2Skill Event Page
          </a>
        </div>
      </footer>
    </div>
  );
}
