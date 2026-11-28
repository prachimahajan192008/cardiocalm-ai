import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  HeartPulse,
  PhoneCall,
  Send,
  ShieldAlert,
  Wind,
} from 'lucide-react';
import { DEFAULT_EMERGENCY_PROFILE } from '../data/plans';
import type {
  AssessmentHistoryEntry,
  CalmMessage,
  CardiacAssessment,
  DispatchPacket,
  EmergencyProfile,
  VitalsSnapshot,
} from '../types';
import { ResilientImage } from './ResilientImage';

const PROFILE_STORAGE_KEY = 'cardiocalm_emergency_profile_v1';
const HISTORY_STORAGE_KEY = 'cardiocalm_assessment_history_v1';

const SYMPTOM_OPTIONS = [
  'Chest tightness / pressure',
  'Shortness of breath',
  'Left arm or jaw discomfort',
  'Cold sweat',
  'Dizziness / lightheadedness',
  'Palpitations',
];

const PRESETS: {
  id: string;
  label: string;
  vitals: VitalsSnapshot;
}[] = [
  {
    id: 'baseline',
    label: 'Resting Baseline',
    vitals: {
      heartRate: 68,
      hrvMs: 52,
      systolicBp: 116,
      diastolicBp: 74,
      spo2: 99,
      symptoms: [],
      contextNotes: 'Seated calmly after morning walk.',
    },
  },
  {
    id: 'warning',
    label: 'Stress Spike',
    vitals: {
      heartRate: 108,
      hrvMs: 21,
      systolicBp: 148,
      diastolicBp: 92,
      spo2: 96,
      symptoms: ['Palpitations', 'Dizziness / lightheadedness'],
      contextNotes: 'Sudden HR spike and HRV drop while resting at desk.',
    },
  },
  {
    id: 'acute',
    label: 'Acute Alert',
    vitals: {
      heartRate: 128,
      hrvMs: 13,
      systolicBp: 166,
      diastolicBp: 98,
      spo2: 93,
      symptoms: [
        'Chest tightness / pressure',
        'Shortness of breath',
        'Cold sweat',
      ],
      contextNotes: 'Symptoms started 12 minutes ago; patient feels anxious.',
    },
  },
];

type BreathPhase = 'Inhale' | 'Hold' | 'Exhale';

export function CareAppView() {
  const [vitals, setVitals] = useState<VitalsSnapshot>(PRESETS[1].vitals);
  const [activePresetId, setActivePresetId] = useState<string>('warning');
  const [assessment, setAssessment] = useState<CardiacAssessment | null>(null);
  const [assessLoading, setAssessLoading] = useState(false);
  const [assessError, setAssessError] = useState<string | null>(null);

  const [history, setHistory] = useState<AssessmentHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as AssessmentHistoryEntry[]) : [];
    } catch {
      return [];
    }
  });

  // Calming companion state
  const [messages, setMessages] = useState<CalmMessage[]>([
    {
      id: 'init-1',
      role: 'agent',
      text: 'I am here with you. Sit comfortably with your back supported—let us review your vitals calmly and take one steady breath together.',
      timestamp: 'Now',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // 4-7-8 Breathing Pacer state
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathState, setBreathState] = useState<{
    phase: BreathPhase;
    countdown: number;
  }>({ phase: 'Inhale', countdown: 4 });

  // Persisted Personal Emergency Profile
  const [profile, setProfile] = useState<EmergencyProfile>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      return saved
        ? (JSON.parse(saved) as EmergencyProfile)
        : DEFAULT_EMERGENCY_PROFILE;
    } catch {
      return DEFAULT_EMERGENCY_PROFILE;
    }
  });

  const [dispatchPacket, setDispatchPacket] = useState<DispatchPacket | null>(
    null
  );
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore storage quota errors
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignore storage quota errors
    }
  }, [history]);

  // Breathing timer loop (4s Inhale -> 7s Hold -> 8s Exhale)
  useEffect(() => {
    if (!breathingActive) return;

    const timer = window.setInterval(() => {
      setBreathState((prev) => {
        if (prev.countdown > 1) {
          return { ...prev, countdown: prev.countdown - 1 };
        }
        if (prev.phase === 'Inhale') {
          return { phase: 'Hold', countdown: 7 };
        }
        if (prev.phase === 'Hold') {
          return { phase: 'Exhale', countdown: 8 };
        }
        return { phase: 'Inhale', countdown: 4 };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [breathingActive]);

  const toggleSymptom = (symptom: string) => {
    setVitals((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  };

  const applyPreset = (presetId: string) => {
    const found = PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setActivePresetId(presetId);
    setVitals(found.vitals);
    setAssessment(null);
    setDispatchPacket(null);
  };

  const vitalsSummaryString = `HR ${vitals.heartRate} bpm, HRV ${vitals.hrvMs} ms, BP ${vitals.systolicBp}/${vitals.diastolicBp} mmHg, SpO2 ${vitals.spo2}%, Symptoms: ${vitals.symptoms.length > 0 ? vitals.symptoms.join(', ') : 'None'}`;

  const handleRunAssessment = async () => {
    setAssessLoading(true);
    setAssessError(null);
    try {
      const res = await fetch('/api/gemini/cardiac-assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vitals),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Assessment failed.');
      }
      const typed = data as CardiacAssessment;
      setAssessment(typed);

      const entry: AssessmentHistoryEntry = {
        id: `assess-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        heartRate: vitals.heartRate,
        hrvMs: vitals.hrvMs,
        bloodPressure: `${vitals.systolicBp}/${vitals.diastolicBp}`,
        spo2: vitals.spo2,
        riskTier: typed.riskTier,
        headline: typed.headline,
      };
      setHistory((prev) => [entry, ...prev].slice(0, 12));

      if (typed.calmingOpening) {
        setMessages((prev) => [
          ...prev,
          {
            id: `agent-${Date.now()}`,
            role: 'agent',
            text: typed.calmingOpening,
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ]);
      }
    } catch (err) {
      setAssessError(
        err instanceof Error ? err.message : 'Could not run cardiac assessment.'
      );
    } finally {
      setAssessLoading(false);
    }
  };

  const handleSendCalmMessage = async (textOverride?: string) => {
    const textToSend = (textOverride ?? chatInput).trim();
    if (!textToSend || chatLoading) return;

    const userMsg: CalmMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!textOverride) setChatInput('');
    setChatLoading(true);
    setChatError(null);

    try {
      const res = await fetch('/api/gemini/calm-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          vitalsSummary: vitalsSummaryString,
          riskTier: assessment?.riskTier ?? 'Unassessed',
          history: nextHistory.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get calming response.');
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          role: 'agent',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } catch (err) {
      setChatError(
        err instanceof Error ? err.message : 'Unable to send message.'
      );
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerateDispatch = async () => {
    setDispatchLoading(true);
    setDispatchError(null);
    try {
      const res = await fetch('/api/gemini/dispatch-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: profile.patientName,
          locationNote: profile.locationNote,
          emergencyContact: profile.emergencyContact,
          medicalNotes: profile.medicalNotes,
          vitalsSummary: vitalsSummaryString,
          symptoms: vitals.symptoms,
          riskTier: assessment?.riskTier ?? 'Elevated / Precautionary',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate dispatch brief.');
      }
      setDispatchPacket(data as DispatchPacket);
    } catch (err) {
      setDispatchError(
        err instanceof Error ? err.message : 'Error creating dispatch packet.'
      );
    } finally {
      setDispatchLoading(false);
    }
  };

  const handleCopy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1600);
  };

  const renderRiskBadge = (tier: CardiacAssessment['riskTier']) => {
    if (tier === 'High Alert') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
          <ShieldAlert className="w-4 h-4" />
          High Alert — Immediate Action Recommended
        </span>
      );
    }
    if (tier === 'Elevated') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
          <AlertTriangle className="w-4 h-4" />
          Elevated — Close Monitoring Advised
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700">
        <CheckCircle2 className="w-4 h-4" />
        Nominal — Vitals Within Expected Range
      </span>
    );
  };

  const breathScale = !breathingActive
    ? 'scale(1)'
    : breathState.phase === 'Inhale'
      ? 'scale(1.2)'
      : breathState.phase === 'Hold'
        ? 'scale(1.2)'
        : 'scale(0.92)';

  const ecgStroke = vitals.heartRate >= 115 ? '#fb7185' : '#2dd4bf';

  return (
    <div className="space-y-6">
      {/* Midnight Telemetry Console Header */}
      <div className="bg-[#0B1320] text-slate-100 rounded-2xl p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-medium text-teal-300">
            <HeartPulse className="w-4 h-4" />
            CardioCalm Personal Care Monitor
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Check vitals, steady your breathing, and coordinate responders.
          </h1>
          <p className="text-xs text-slate-300">
            Decision-support monitor — if you are experiencing an active medical emergency, call local emergency services immediately.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-800/90 rounded-xl shrink-0 self-start lg:self-auto">
          {PRESETS.map((preset) => {
            const active = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 3-Pillar Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Pillar 1: Telemetry & Prediction */}
        <section className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                01. Biometric Risk Check
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Synced wearable vitals and symptom inputs
              </p>
            </div>
            <Activity className="w-4 h-4 text-teal-700" />
          </div>

          {/* Animated SVG ECG Monitor */}
          <div className="bg-[#0B1320] rounded-xl p-4 text-slate-100 overflow-hidden">
            <div className="flex items-center justify-between text-xs mb-2.5">
              <span className="text-slate-400">Lead II Rhythm Strip</span>
              <span className="font-mono tabular-nums font-semibold text-teal-300">
                {vitals.heartRate} BPM <span aria-hidden="true">·</span> HRV {vitals.hrvMs} ms
              </span>
            </div>
            <div className="overflow-hidden w-full h-12">
              <svg
                viewBox="0 0 720 56"
                className="w-[200%] h-12 animate-ecg-sweep"
                aria-label="ECG waveform trace"
              >
                <path
                  d="M0 32 L32 32 L38 26 L44 32 L54 32 L58 38 L64 8 L70 46 L76 32 L92 32 L100 24 L108 32 L140 32 L146 26 L152 32 L162 32 L166 38 L172 8 L178 46 L184 32 L200 32 L208 24 L216 32 L248 32 L254 26 L260 32 L270 32 L274 38 L280 8 L286 46 L292 32 L308 32 L316 24 L324 32 L360 32 L392 32 L398 26 L404 32 L414 32 L418 38 L424 8 L430 46 L436 32 L452 32 L460 24 L468 32 L500 32 L506 26 L512 32 L522 32 L526 38 L532 8 L538 46 L544 32 L560 32 L568 24 L576 32 L608 32 L614 26 L620 32 L630 32 L634 38 L640 8 L646 46 L652 32 L668 32 L676 24 L684 32 L720 32"
                  fill="none"
                  stroke={ecgStroke}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Vitals Controls */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label htmlFor="hr-input" className="block text-xs font-medium text-slate-700">
                Heart Rate (bpm)
              </label>
              <input
                id="hr-input"
                type="number"
                min={35}
                max={220}
                value={vitals.heartRate}
                onChange={(e) =>
                  setVitals((v) => ({ ...v, heartRate: Number(e.target.value) || 0 }))
                }
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="hrv-input" className="block text-xs font-medium text-slate-700">
                HRV RMSSD (ms)
              </label>
              <input
                id="hrv-input"
                type="number"
                min={5}
                max={150}
                value={vitals.hrvMs}
                onChange={(e) =>
                  setVitals((v) => ({ ...v, hrvMs: Number(e.target.value) || 0 }))
                }
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="bp-input" className="block text-xs font-medium text-slate-700">
                Systolic / Diastolic
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="bp-input"
                  type="number"
                  min={70}
                  max={240}
                  value={vitals.systolicBp}
                  onChange={(e) =>
                    setVitals((v) => ({ ...v, systolicBp: Number(e.target.value) || 0 }))
                  }
                  className="w-full px-2.5 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
                <span className="text-slate-400">/</span>
                <input
                  aria-label="Diastolic BP"
                  type="number"
                  min={40}
                  max={140}
                  value={vitals.diastolicBp}
                  onChange={(e) =>
                    setVitals((v) => ({ ...v, diastolicBp: Number(e.target.value) || 0 }))
                  }
                  className="w-full px-2.5 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="spo2-input" className="block text-xs font-medium text-slate-700">
                SpO2 (%)
              </label>
              <input
                id="spo2-input"
                type="number"
                min={70}
                max={100}
                value={vitals.spo2}
                onChange={(e) =>
                  setVitals((v) => ({ ...v, spo2: Number(e.target.value) || 0 }))
                }
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>
          </div>

          {/* Symptoms */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-700">How Are You Feeling?</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SYMPTOM_OPTIONS.map((symptom) => {
                const active = vitals.symptoms.includes(symptom);
                return (
                  <label
                    key={symptom}
                    className={`flex items-center gap-2 px-3 py-2 text-xs border rounded-lg cursor-pointer transition-colors ${
                      active
                        ? 'border-teal-700 bg-teal-50 text-slate-900 font-medium'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleSymptom(symptom)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-teal-700"
                    />
                    <span className="truncate">{symptom}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="context-notes" className="block text-xs font-medium text-slate-700">
              Activity / Context Note
            </label>
            <input
              id="context-notes"
              type="text"
              value={vitals.contextNotes}
              onChange={(e) =>
                setVitals((v) => ({ ...v, contextNotes: e.target.value }))
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>

          <button
            type="button"
            onClick={handleRunAssessment}
            disabled={assessLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-teal-700 rounded-xl hover:bg-teal-800 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {assessLoading ? 'Analyzing Vitals...' : 'Run Risk Assessment'}
          </button>

          {assessError && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {assessError}
            </div>
          )}

          {assessment && (
            <div className="pt-4 border-t border-slate-200 space-y-3 text-xs">
              <div>{renderRiskBadge(assessment.riskTier)}</div>
              <p className="text-sm font-medium text-slate-900 leading-snug">
                {assessment.headline}
              </p>

              <div className="space-y-1">
                <div className="font-semibold text-slate-800">Observed Signals</div>
                <ul className="space-y-1 text-slate-600">
                  {assessment.earlySignals.map((sig, i) => (
                    <li key={i}>• {sig}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1">
                <div className="font-semibold text-slate-800">
                  Recommended Action ({assessment.escalationAction})
                </div>
                <ul className="space-y-1 text-slate-600">
                  {assessment.immediateGuidance.map((step, i) => (
                    <li key={i}>• {step}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        {/* Pillar 2 & Pillar 3 Stack */}
        <div className="lg:col-span-7 space-y-6">
          {/* Pillar 2: Calming & Grounding Companion */}
          <section className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
            <div className="relative h-28 overflow-hidden">
              <ResilientImage
                src="/src/assets/images/calming_breath_sanctuary_1795628328357.jpg"
                alt="Serene sunlit architectural space for calm breathing"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1320]/85 via-[#0B1320]/45 to-transparent" />
              <div className="absolute bottom-3 inset-x-6 flex items-center justify-between gap-3">
                <div className="text-white">
                  <h2 className="text-base font-semibold">
                    02. Calm Breathing &amp; Grounding Care
                  </h2>
                  <p className="text-xs text-slate-200">
                    Synchronized 4-7-8 pacer and supportive dialogue
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (breathingActive) {
                      setBreathingActive(false);
                    } else {
                      setBreathState({ phase: 'Inhale', countdown: 4 });
                      setBreathingActive(true);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-900 bg-white rounded-lg hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Wind className="w-3.5 h-3.5 text-teal-700" />
                  {breathingActive ? 'Stop Guide' : 'Start Breathing'}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Pacer Widget */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div
                  style={{
                    transform: breathScale,
                    transition: 'transform 900ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  className="w-14 h-14 rounded-full bg-teal-50 border-2 border-teal-600 flex items-center justify-center font-mono text-sm font-semibold text-teal-900 tabular-nums shrink-0"
                >
                  {breathingActive ? `${breathState.countdown}s` : '4-7-8'}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {breathingActive
                      ? `${breathState.phase} slowly`
                      : '4-7-8 Paced Breathing Ready'}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {breathingActive
                      ? 'Keep shoulders relaxed and seated upright. Follow the count gently.'
                      : 'Helps reduce acute anxiety and steady sympathetic response.'}
                  </p>
                </div>
              </div>

              {/* Grounding Dialogue */}
              <div className="space-y-3">
                <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                        m.role === 'agent'
                          ? 'bg-slate-50 border border-slate-200 text-slate-800'
                          : 'bg-teal-50 border border-teal-200 text-slate-900 ml-8'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-medium">
                          {m.role === 'agent' ? 'CardioCalm' : 'You'}
                        </span>
                        <span className="tabular-nums">{m.timestamp}</span>
                      </div>
                      <p>{m.text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    'My heart feels like it is racing and I feel anxious.',
                    'Help me slow down my breathing.',
                    'When should I call emergency services?',
                  ].map((quickPrompt) => (
                    <button
                      key={quickPrompt}
                      type="button"
                      onClick={() => handleSendCalmMessage(quickPrompt)}
                      disabled={chatLoading}
                      className="px-2.5 py-1.5 text-xs text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      {quickPrompt}
                    </button>
                  ))}
                </div>

                {chatError && (
                  <p className="text-xs text-rose-600">{chatError}</p>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendCalmMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Tell CardioCalm how you are feeling..."
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#0B1320] rounded-lg hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {chatLoading ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>
            </div>
          </section>

          {/* Pillar 3: Emergency Response Coordination */}
          <section className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
            <div className="relative h-28 overflow-hidden">
              <ResilientImage
                src="/src/assets/images/emergency_dispatch_console_1795628328870.jpg"
                alt="Medical emergency coordination console"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1320]/90 via-[#0B1320]/55 to-transparent" />
              <div className="absolute bottom-3 inset-x-6 flex items-center justify-between gap-3">
                <div className="text-white">
                  <h2 className="text-base font-semibold">
                    03. Emergency Response Coordination
                  </h2>
                  <p className="text-xs text-slate-200">
                    Saved medical profile, EMS script, and family alert packet
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateDispatch}
                  disabled={dispatchLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  {dispatchLoading ? 'Preparing Packet...' : 'Generate Dispatch Brief'}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label htmlFor="emer-name" className="block text-xs font-medium text-slate-700">
                    Member Name
                  </label>
                  <input
                    id="emer-name"
                    type="text"
                    value={profile.patientName}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, patientName: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="emer-contact" className="block text-xs font-medium text-slate-700">
                    Primary Emergency Contact
                  </label>
                  <input
                    id="emer-contact"
                    type="text"
                    value={profile.emergencyContact}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, emergencyContact: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="emer-loc" className="block text-xs font-medium text-slate-700">
                    Address &amp; Entry Access Note
                  </label>
                  <input
                    id="emer-loc"
                    type="text"
                    value={profile.locationNote}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, locationNote: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="emer-meds" className="block text-xs font-medium text-slate-700">
                    Medications &amp; Allergies
                  </label>
                  <input
                    id="emer-meds"
                    type="text"
                    value={profile.medicalNotes}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, medicalNotes: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {dispatchError && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                  {dispatchError}
                </div>
              )}

              {dispatchPacket && (
                <div className="space-y-4 pt-3 border-t border-slate-200 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">
                        EMS Dispatcher Summary
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy('ems', dispatchPacket.emsScript)}
                        className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 cursor-pointer"
                      >
                        {copiedKey === 'ems' ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="p-3 font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {dispatchPacket.emsScript}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">
                        Emergency Contact Alert Message
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy('contact', dispatchPacket.contactAlertMessage)
                        }
                        className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 cursor-pointer"
                      >
                        {copiedKey === 'contact' ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 leading-relaxed">
                      {dispatchPacket.contactAlertMessage}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-semibold text-slate-900">
                      While Awaiting Responders
                    </div>
                    <ul className="space-y-1 text-slate-600">
                      {dispatchPacket.responderChecklist.map((step, i) => (
                        <li key={i}>
                          {i + 1}. {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Assessment History Table */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Recent Cardiac Triage Log
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Vitals checks recorded in your browser session for trend review
            </p>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setHistory([])}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Clear Log
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            No checks logged yet. Run a risk assessment above to record your first entry.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-4 font-medium">Time</th>
                  <th className="py-2.5 pr-4 font-medium text-right">HR</th>
                  <th className="py-2.5 pr-4 font-medium text-right">HRV</th>
                  <th className="py-2.5 pr-4 font-medium text-right">BP</th>
                  <th className="py-2.5 pr-4 font-medium text-right">SpO2</th>
                  <th className="py-2.5 pr-4 font-medium">Tier</th>
                  <th className="py-2.5 font-medium">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pr-4 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                      {item.timestamp}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono tabular-nums text-slate-800">
                      {item.heartRate} bpm
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono tabular-nums text-slate-800">
                      {item.hrvMs} ms
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono tabular-nums text-slate-800">
                      {item.bloodPressure}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono tabular-nums text-slate-800">
                      {item.spo2}%
                    </td>
                    <td className="py-2.5 pr-4 font-medium whitespace-nowrap">
                      <span
                        className={
                          item.riskTier === 'High Alert'
                            ? 'text-rose-700'
                            : item.riskTier === 'Elevated'
                              ? 'text-amber-700'
                              : 'text-teal-700'
                        }
                      >
                        {item.riskTier}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-700 max-w-md truncate">
                      {item.headline}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
