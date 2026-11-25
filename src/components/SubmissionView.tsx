import { useState } from 'react';
import { Check, Copy, Download, Sparkles } from 'lucide-react';
import type { SubmissionDraft } from '../types';

interface SubmissionViewProps {
  draft: SubmissionDraft;
  onChange: (updated: SubmissionDraft) => void;
  onBuildMarkdown: (draft: SubmissionDraft) => string;
}

export function SubmissionView({
  draft,
  onChange,
  onBuildMarkdown,
}: SubmissionViewProps) {
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishError, setPolishError] = useState<string | null>(null);
  const [copiedMd, setCopiedMd] = useState(false);

  const updateField = <K extends keyof SubmissionDraft>(
    key: K,
    value: SubmissionDraft[K]
  ) => {
    onChange({
      ...draft,
      [key]: value,
      updatedAt: new Date().toLocaleString(),
    });
  };

  const handlePolishStrategy = async () => {
    setIsPolishing(true);
    setPolishError(null);
    try {
      const res = await fetch('/api/gemini/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.projectTitle,
          problemStatement: draft.problemStatement,
          strategy: draft.strategyRationale,
          notes: draft.demoNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to polish submission strategy.');
      }
      updateField('strategyRationale', data.polishedStrategy);
    } catch (err) {
      setPolishError(
        err instanceof Error ? err.message : 'Unexpected error polishing text.'
      );
    } finally {
      setIsPolishing(false);
    }
  };

  const markdownPreview = onBuildMarkdown(draft);

  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(markdownPreview);
    setCopiedMd(true);
    window.setTimeout(() => setCopiedMd(false), 1800);
  };

  const handleDownload = (ext: 'md' | 'json') => {
    const content =
      ext === 'md' ? markdownPreview : JSON.stringify(draft, null, 2);
    const mime = ext === 'md' ? 'text/markdown' : 'application/json';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promptwars-submission.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Editable Submission Fields */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Submission Package Builder
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pre-stage your participant details, prompt strategy, and tested output for Hack2Skill.
            </p>
          </div>
          {draft.updatedAt && (
            <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
              Saved {draft.updatedAt}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="part-name" className="block text-xs font-medium text-slate-700">
              Participant Name
            </label>
            <input
              id="part-name"
              type="text"
              value={draft.participantName}
              onChange={(e) => updateField('participantName', e.target.value)}
              placeholder="Your full name"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="part-email" className="block text-xs font-medium text-slate-700">
              Email
            </label>
            <input
              id="part-email"
              type="email"
              value={draft.participantEmail}
              onChange={(e) => updateField('participantEmail', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="h2s-handle" className="block text-xs font-medium text-slate-700">
              Hack2Skill Username / Handle
            </label>
            <input
              id="h2s-handle"
              type="text"
              value={draft.hack2skillHandle}
              onChange={(e) => updateField('hack2skillHandle', e.target.value)}
              placeholder="@username"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="proj-title" className="block text-xs font-medium text-slate-700">
              Submission Title
            </label>
            <input
              id="proj-title"
              type="text"
              value={draft.projectTitle}
              onChange={(e) => updateField('projectTitle', e.target.value)}
              placeholder="e.g., Constraint-Driven Civic Triage Prompt System"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="prob-stmt" className="block text-xs font-medium text-slate-700">
            Assigned Problem Statement
          </label>
          <textarea
            id="prob-stmt"
            rows={3}
            value={draft.problemStatement}
            onChange={(e) => updateField('problemStatement', e.target.value)}
            placeholder="Paste the assigned online challenge brief here..."
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="strategy" className="block text-xs font-medium text-slate-700">
              Prompt Strategy & Reasoning
            </label>
            <button
              type="button"
              onClick={handlePolishStrategy}
              disabled={isPolishing || !draft.strategyRationale.trim()}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-800 disabled:opacity-40 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isPolishing ? 'Polishing...' : 'Polish with Gemini'}
            </button>
          </div>
          <textarea
            id="strategy"
            rows={4}
            value={draft.strategyRationale}
            onChange={(e) => updateField('strategyRationale', e.target.value)}
            placeholder="Explain how you decomposed the task, enforced constraints, and handled edge cases..."
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
          {polishError && (
            <p className="text-xs text-red-600">{polishError}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="final-sys" className="block text-xs font-medium text-slate-700">
            Final System Instruction
          </label>
          <textarea
            id="final-sys"
            rows={3}
            value={draft.finalSystemPrompt}
            onChange={(e) => updateField('finalSystemPrompt', e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="final-usr" className="block text-xs font-medium text-slate-700">
            Final User Prompt
          </label>
          <textarea
            id="final-usr"
            rows={4}
            value={draft.finalUserPrompt}
            onChange={(e) => updateField('finalUserPrompt', e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="verified-out" className="block text-xs font-medium text-slate-700">
            Verified Sample Output
          </label>
          <textarea
            id="verified-out"
            rows={4}
            value={draft.verifiedOutput}
            onChange={(e) => updateField('verifiedOutput', e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="tools-used" className="block text-xs font-medium text-slate-700">
              AI Tools & Models Used
            </label>
            <input
              id="tools-used"
              type="text"
              value={draft.toolsUsed}
              onChange={(e) => updateField('toolsUsed', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="demo-notes" className="block text-xs font-medium text-slate-700">
              Demo / Repo Link & Notes
            </label>
            <input
              id="demo-notes"
              type="text"
              value={draft.demoNotes}
              onChange={(e) => updateField('demoNotes', e.target.value)}
              placeholder="Live preview URL or key verification notes"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
        </div>
      </div>

      {/* Right: Export & Live Markdown Preview */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4 lg:sticky lg:top-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">
            Submission Export Preview
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedMd ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy MD
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleDownload('md')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              .md
            </button>
            <button
              type="button"
              onClick={() => handleDownload('json')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              .json
            </button>
          </div>
        </div>

        <pre className="p-4 text-xs font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-lg whitespace-pre-wrap break-words max-h-[600px] overflow-y-auto leading-relaxed">
          {markdownPreview}
        </pre>
      </div>
    </div>
  );
}
