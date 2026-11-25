import { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Pause,
  Play,
  RotateCcw,
  Send,
  Sparkles,
} from 'lucide-react';
import { PROMPT_PATTERNS } from '../data/challenges';
import type { ChallengeScenario, CritiqueResult, PromptRevision } from '../types';

interface PromptLabViewProps {
  scenarios: ChallengeScenario[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  revisions: PromptRevision[];
  onAddRevision: (revision: PromptRevision) => void;
  onSendToSubmission: (payload: {
    problemStatement: string;
    systemPrompt: string;
    userPrompt: string;
    output: string;
  }) => void;
}

export function PromptLabView({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  revisions,
  onAddRevision,
  onSendToSubmission,
}: PromptLabViewProps) {
  const activeScenario =
    scenarios.find((s) => s.id === selectedScenarioId) ?? scenarios[0];

  const [customBrief, setCustomBrief] = useState(activeScenario.brief);
  const [systemInstruction, setSystemInstruction] = useState(
    activeScenario.starterSystemInstruction
  );
  const [userPrompt, setUserPrompt] = useState(activeScenario.starterPrompt);
  const [jsonMode, setJsonMode] = useState(activeScenario.id === 'structured-triage');

  const [outputText, setOutputText] = useState('');
  const [lastMetrics, setLastMetrics] = useState<{
    latencyMs: number;
    wordCount: number;
    charCount: number;
  } | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const [critique, setCritique] = useState<CritiqueResult | null>(null);
  const [critiqueError, setCritiqueError] = useState<string | null>(null);
  const [isCritiquing, setIsCritiquing] = useState(false);

  const [copiedOutput, setCopiedOutput] = useState(false);
  const [sentToDraft, setSentToDraft] = useState(false);

  // Sprint timer state
  const [timerSeconds, setTimerSeconds] = useState(
    activeScenario.timeboxMinutes * 60
  );
  const [timerRunning, setTimerRunning] = useState(false);

  // Compare revision selector
  const [compareRevisionId, setCompareRevisionId] = useState<string>('');

  // Sync editor defaults when scenario changes
  useEffect(() => {
    setCustomBrief(activeScenario.brief);
    setSystemInstruction(activeScenario.starterSystemInstruction);
    setUserPrompt(activeScenario.starterPrompt);
    setJsonMode(activeScenario.id === 'structured-triage');
    setTimerSeconds(activeScenario.timeboxMinutes * 60);
    setTimerRunning(false);
    setCritique(null);
    setCritiqueError(null);
    setRunError(null);
  }, [activeScenario]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  const handleApplyPattern = (patternId: string) => {
    const pattern = PROMPT_PATTERNS.find((p) => p.id === patternId);
    if (!pattern) return;
    setSystemInstruction((prev) =>
      prev.trim() ? `${prev.trim()}\n\n${pattern.systemSnippet}` : pattern.systemSnippet
    );
    setUserPrompt((prev) =>
      prev.trim() ? `${prev.trim()}\n\n${pattern.promptSnippet}` : pattern.promptSnippet
    );
  };

  const handleRunPrompt = async () => {
    setIsRunning(true);
    setRunError(null);
    try {
      const res = await fetch('/api/gemini/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction,
          prompt: userPrompt,
          jsonMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to run prompt.');
      }
      setOutputText(data.text);
      setLastMetrics({
        latencyMs: data.latencyMs,
        wordCount: data.wordCount,
        charCount: data.charCount,
      });

      const newRevision: PromptRevision = {
        id: `rev-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        challengeId: activeScenario.id,
        challengeTitle: activeScenario.title,
        systemInstruction,
        prompt: userPrompt,
        jsonMode,
        output: data.text,
        latencyMs: data.latencyMs,
        wordCount: data.wordCount,
      };
      onAddRevision(newRevision);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Unexpected error running prompt.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCritiquePrompt = async () => {
    setIsCritiquing(true);
    setCritiqueError(null);
    try {
      const res = await fetch('/api/gemini/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeTitle: activeScenario.title,
          challengeBrief: activeScenario.isCustom ? customBrief : activeScenario.brief,
          systemInstruction,
          prompt: userPrompt,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to evaluate prompt.');
      }
      setCritique(data as CritiqueResult);
    } catch (err) {
      setCritiqueError(
        err instanceof Error ? err.message : 'Unexpected error evaluating prompt.'
      );
    } finally {
      setIsCritiquing(false);
    }
  };

  const handleCopyOutput = async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopiedOutput(true);
    window.setTimeout(() => setCopiedOutput(false), 1800);
  };

  const handleTransferToSubmission = () => {
    onSendToSubmission({
      problemStatement: activeScenario.isCustom ? customBrief : activeScenario.brief,
      systemPrompt: systemInstruction,
      userPrompt,
      output: outputText,
    });
    setSentToDraft(true);
    window.setTimeout(() => setSentToDraft(false), 2000);
  };

  const scenarioRevisions = revisions.filter(
    (r) => r.challengeId === activeScenario.id
  );
  const comparedRevision = scenarioRevisions.find(
    (r) => r.id === compareRevisionId
  );

  return (
    <div className="space-y-6">
      {/* Top Scenario & Sprint Timer Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
          <label
            htmlFor="scenario-select"
            className="text-xs font-medium text-slate-500 whitespace-nowrap shrink-0"
          >
            Active Task
          </label>
          <select
            id="scenario-select"
            value={activeScenario.id}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="w-full sm:max-w-md px-3 py-2 text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3 py-1.5 bg-slate-100 rounded-lg font-mono text-sm font-semibold text-slate-900 tabular-nums">
            {formatTimer(timerSeconds)}
          </div>
          <button
            type="button"
            onClick={() => setTimerRunning((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {timerRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Start Timer
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setTimerRunning(false);
              setTimerSeconds(activeScenario.timeboxMinutes * 60);
            }}
            aria-label="Reset timer"
            className="inline-flex items-center justify-center p-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Challenge Brief */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">
            {activeScenario.title}
          </h2>
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {activeScenario.category} <span aria-hidden="true">·</span>{' '}
            <span className="tabular-nums">{activeScenario.timeboxMinutes} min timebox</span>
          </span>
        </div>

        {activeScenario.isCustom ? (
          <div className="space-y-1.5">
            <label
              htmlFor="custom-brief"
              className="block text-xs font-medium text-slate-600"
            >
              Kickoff Problem Statement (editable)
            </label>
            <textarea
              id="custom-brief"
              rows={3}
              value={customBrief}
              onChange={(e) => setCustomBrief(e.target.value)}
              placeholder="Paste the live PromptWars problem statement here..."
              className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
        ) : (
          <p className="text-sm text-slate-700 leading-relaxed">{activeScenario.brief}</p>
        )}

        <div className="pt-3 border-t border-slate-100">
          <div className="text-xs font-medium text-slate-500 mb-2">
            Key Constraints
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
            {activeScenario.constraints.map((c, idx) => (
              <li key={idx} className="leading-relaxed">
                {idx + 1}. {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Dual-Column Lab */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Prompt Authoring */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-500">
              Insert Reusable Pattern
            </div>
            <div className="flex flex-wrap gap-2">
              {PROMPT_PATTERNS.map((pattern) => (
                <button
                  key={pattern.id}
                  type="button"
                  onClick={() => handleApplyPattern(pattern.id)}
                  title={pattern.summary}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  + {pattern.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="system-instruction"
              className="block text-xs font-medium text-slate-700"
            >
              System Instruction (Role & Guardrails)
            </label>
            <textarea
              id="system-instruction"
              rows={4}
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              placeholder="Define role, tone, negative constraints, and output rules..."
              className="w-full px-3.5 py-2.5 text-sm font-mono text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="user-prompt"
              className="block text-xs font-medium text-slate-700"
            >
              User Task Prompt
            </label>
            <textarea
              id="user-prompt"
              rows={8}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Write your structured prompt here..."
              className="w-full px-3.5 py-2.5 text-sm font-mono text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={jsonMode}
                onChange={(e) => setJsonMode(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700"
              />
              Enforce JSON output
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCritiquePrompt}
                disabled={isCritiquing || isRunning}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isCritiquing ? 'Evaluating...' : 'Critique Prompt'}
              </button>
              <button
                type="button"
                onClick={handleRunPrompt}
                disabled={isRunning}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {isRunning ? 'Running...' : 'Run Prompt'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Output & AI Judge Critique */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Gemini 4 Hydrogen Output
                </h3>
                {lastMetrics && (
                  <p className="text-xs text-slate-500 tabular-nums mt-0.5">
                    {lastMetrics.latencyMs} ms <span aria-hidden="true">·</span>{' '}
                    {lastMetrics.wordCount} words <span aria-hidden="true">·</span>{' '}
                    {lastMetrics.charCount} chars
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyOutput}
                  disabled={!outputText}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedOutput ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleTransferToSubmission}
                  disabled={!userPrompt.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 rounded-lg hover:bg-teal-100 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {sentToDraft ? 'Saved to Draft' : 'Send to Submission'}
                </button>
              </div>
            </div>

            {runError && (
              <div className="p-3.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                {runError}
              </div>
            )}

            {isRunning ? (
              <div className="space-y-2.5 py-4">
                <div className="h-3.5 bg-slate-100 rounded w-3/4 animate-pulse" />
                <div className="h-3.5 bg-slate-100 rounded w-full animate-pulse" />
                <div className="h-3.5 bg-slate-100 rounded w-5/6 animate-pulse" />
                <div className="h-3.5 bg-slate-100 rounded w-2/3 animate-pulse" />
              </div>
            ) : outputText ? (
              <pre className="p-4 text-xs font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-lg whitespace-pre-wrap break-words max-h-[360px] overflow-y-auto leading-relaxed">
                {outputText}
              </pre>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg">
                <p className="text-sm text-slate-500">
                  Run your prompt to inspect the live model response, latency, and word count.
                </p>
              </div>
            )}
          </div>

          {/* Critique Panel */}
          {(isCritiquing || critique || critiqueError) && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Prompt Judge Critique
                </h3>
                {critique && (
                  <button
                    type="button"
                    onClick={() => setUserPrompt(critique.improvedPrompt)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Apply Improved Prompt
                  </button>
                )}
              </div>

              {critiqueError && (
                <div className="p-3.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {critiqueError}
                </div>
              )}

              {isCritiquing ? (
                <div className="space-y-2 py-2">
                  <div className="h-3.5 bg-slate-100 rounded w-full animate-pulse" />
                  <div className="h-3.5 bg-slate-100 rounded w-4/5 animate-pulse" />
                </div>
              ) : (
                critique && (
                  <div className="space-y-4 text-xs text-slate-700">
                    <p className="text-sm text-slate-800 leading-relaxed">
                      {critique.summary}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                      <div>
                        <div className="font-semibold text-slate-900 mb-1.5">
                          Strengths
                        </div>
                        <ul className="space-y-1 text-slate-600">
                          {critique.strengths.map((s, i) => (
                            <li key={i}>• {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 mb-1.5">
                          Blind Spots
                        </div>
                        <ul className="space-y-1 text-slate-600">
                          {critique.blindSpots.map((b, i) => (
                            <li key={i}>• {b}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <div className="font-semibold text-slate-900 mb-1.5">
                        Recommended Edge Cases to Test
                      </div>
                      <ul className="space-y-1 text-slate-600">
                        {critique.edgeCases.map((edge, i) => (
                          <li key={i}>• {edge}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <div className="font-semibold text-slate-900 mb-1.5">
                        Suggested Rewrite
                      </div>
                      <pre className="p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg whitespace-pre-wrap break-words">
                        {critique.improvedPrompt}
                      </pre>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Revision History & Comparison */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Saved Revisions for This Task
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Every test run is logged automatically so you can restore or inspect prior iterations.
            </p>
          </div>
          {scenarioRevisions.length > 0 && (
            <select
              aria-label="Inspect saved revision"
              value={compareRevisionId}
              onChange={(e) => setCompareRevisionId(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="">Select a revision to inspect...</option>
              {scenarioRevisions.map((rev, idx) => (
                <option key={rev.id} value={rev.id}>
                  Run #{scenarioRevisions.length - idx} — {rev.timestamp} ({rev.wordCount} words)
                </option>
              ))}
            </select>
          )}
        </div>

        {scenarioRevisions.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            No runs recorded for this task yet. Click Run Prompt above to log your first iteration.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-4 font-medium">Time</th>
                  <th className="py-2.5 pr-4 font-medium">Prompt Preview</th>
                  <th className="py-2.5 pr-4 font-medium text-right">Words</th>
                  <th className="py-2.5 pr-4 font-medium text-right">Latency</th>
                  <th className="py-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scenarioRevisions.slice(0, 6).map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pr-4 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                      {rev.timestamp}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-800 max-w-md truncate">
                      {rev.prompt}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-slate-600 tabular-nums">
                      {rev.wordCount}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-slate-600 tabular-nums">
                      {rev.latencyMs} ms
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSystemInstruction(rev.systemInstruction);
                          setUserPrompt(rev.prompt);
                          setJsonMode(rev.jsonMode);
                          setOutputText(rev.output);
                        }}
                        className="text-teal-700 hover:text-teal-800 font-medium cursor-pointer"
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {comparedRevision && (
          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1.5">
                Saved Prompt ({comparedRevision.timestamp})
              </div>
              <pre className="p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg whitespace-pre-wrap max-h-48 overflow-y-auto">
                {comparedRevision.prompt}
              </pre>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1.5">
                Saved Output ({comparedRevision.wordCount} words)
              </div>
              <pre className="p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg whitespace-pre-wrap max-h-48 overflow-y-auto">
                {comparedRevision.output}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
