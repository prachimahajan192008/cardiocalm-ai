import type { ChallengeScenario, ChecklistItem, PromptPattern, SubmissionDraft } from '../types';

export const EVENT_URL =
  'https://hack2skill.com/event/promptwars-x-aivibeathon2026?utm_source=hack2skill&utm_medium=homepage&sectionid=6aed9df86808a5c6d6f86407';

export const CARDIAC_PROBLEM_STATEMENT =
  'A personal health agent that predicts cardiac events, calms the patient and coordinates emergency response';

export const CARDIAC_SYSTEM_PROMPT = `You are CardioCalm, a personal cardiac safety and emergency-triage agent.
Operate across three coordinated responsibilities:
1. Early Risk Prediction: Evaluate wearable vitals (HR, HRV/RMSSD, blood pressure, SpO2) alongside self-reported symptoms (chest pressure, radiating pain, dyspnea, diaphoresis, dizziness) to classify risk as Nominal, Elevated, or High Alert. Never fabricate clinical measurements or claim a definitive diagnosis.
2. Patient De-escalation: Address the user in short, grounded, non-alarmist sentences. Guide seated rest and paced breathing (4-7-8 cadence) to lower sympathetic arousal while monitoring continues.
3. Emergency Coordination: When High Alert criteria are met—or on patient request—generate a structured EMS dispatch summary (vitals trend, symptom onset, medications/allergies, access instructions) and a clear emergency-contact alert.`;

export const CARDIAC_USER_PROMPT = `Analyze the following patient telemetry snapshot and return a structured 3-part response:
1. Risk Classification & Early Warning Signals
2. Immediate Calming Protocol (3 short grounding steps + breathing cue)
3. Emergency Coordination Packet (EMS summary + family alert draft + door/phone readiness steps)

Telemetry Snapshot:
- Heart Rate: 126 bpm (resting baseline 68 bpm)
- HRV (RMSSD): 14 ms (significant drop from 46 ms baseline)
- Blood Pressure: 164/98 mmHg
- SpO2: 93%
- Symptoms: Chest tightness for 12 minutes, mild shortness of breath, cold sweat
- History: Mild hypertension; aspirin allergy: none known`;

export const CHALLENGE_SCENARIOS: ChallengeScenario[] = [
  {
    id: 'live-kickoff',
    title: 'Live Kickoff: Personal Cardiac Health Agent',
    category: 'Official Problem Statement',
    timeboxMinutes: 180,
    difficulty: 'Live Kickoff',
    brief: CARDIAC_PROBLEM_STATEMENT,
    constraints: [
      'Predict early cardiac risk from vitals + symptoms without false reassurance or alarmist panic',
      'De-escalate patient anxiety with concise, paced breathing and grounding guidance',
      'Coordinate emergency response with structured EMS + family handoff packets',
    ],
    starterSystemInstruction: CARDIAC_SYSTEM_PROMPT,
    starterPrompt: CARDIAC_USER_PROMPT,
    isCustom: true,
  },
  {
    id: 'vibe-mvp-spec',
    title: '01. Rapid MVP Specification from Ambiguous Brief',
    category: 'Vibe Coding Sprint',
    timeboxMinutes: 30,
    difficulty: 'Sprint',
    brief:
      'A local civic group wants a lightweight tool where residents can report street hazards in under 20 seconds and volunteers can triage duplicates. Craft a prompt that turns this vague request into a build-ready engineering & UX specification.',
    constraints: [
      'Output must separate User Flow, Data Model, and Duplicate-Triage Heuristic',
      'Must specify offline or low-bandwidth fallback behavior',
      'Keep total specification concise enough for a 3-hour build sprint',
    ],
    starterSystemInstruction:
      'You are a pragmatic principal engineer guiding a 3-hour solo hackathon build. Prioritize shipping speed, zero-bloat UX, and explicit data contracts.',
    starterPrompt:
      'Turn this civic hazard-reporting idea into a 3-hour build blueprint:\n1. Core 20-second resident submission flow\n2. Minimal data schema (fields & types)\n3. Simple rule-based duplicate detection\n4. Low-connectivity fallback.',
  },
  {
    id: 'structured-triage',
    title: '02. Deterministic JSON Extraction & Guardrails',
    category: 'Prompt Precision',
    timeboxMinutes: 20,
    difficulty: 'Practice',
    brief:
      'Given messy user support transcripts containing dates, urgency cues, and incomplete contact info, design a prompt that extracts normalized triage records without hallucinating missing fields.',
    constraints: [
      'Return valid JSON only with explicit null values for missing data',
      'Normalize urgency strictly to: low, medium, high, critical',
      'Flag ambiguous inputs in a separate warnings array',
    ],
    starterSystemInstruction:
      'You are a strict information extraction parser. Never infer or fabricate facts not explicitly stated in the source text. Use null for missing fields.',
    starterPrompt:
      'Extract a JSON object with keys { requesterName, contactEmail, urgency, summary, warnings } from this message:\n\n"Hey, the lab printer on floor 3 jammed again right before our 2pm audit!! Call me back on my extension or ping Priya."',
  },
  {
    id: 'creative-campaign',
    title: '03. Multi-Constraint Creative Reasoning',
    category: 'Creative Synthesis',
    timeboxMinutes: 25,
    difficulty: 'Practice',
    brief:
      'Design a prompt that generates an onboarding sequence for first-time AI builders—balancing technical accuracy with encouraging plain language—without sounding repetitive or salesy.',
    constraints: [
      'Produce exactly 3 progressive micro-lessons (5 minutes each)',
      'Each lesson must include 1 concrete hands-on exercise and 1 common pitfall',
      'Ban buzzwords (revolutionary, magic, supercharge, unleash)',
    ],
    starterSystemInstruction:
      'You are a technical curriculum designer. Write in crisp, concrete prose. Avoid marketing clichés and forbidden buzzwords.',
    starterPrompt:
      'Create a 3-part micro-curriculum (5 min each) teaching first-time builders how to write testable prompts. Include one hands-on exercise and one common mistake per part.',
  },
];

export const PROMPT_PATTERNS: PromptPattern[] = [
  {
    id: 'role-contract',
    name: 'Role + Output Contract',
    summary: 'Locks persona, strict negative constraints, and exact section headings.',
    systemSnippet:
      'Act as a senior domain specialist. Follow formatting constraints verbatim. Do not include introductory chatter or unverified claims.',
    promptSnippet:
      'Deliver your response using strictly these 3 sections:\n1. Core Approach\n2. Constraints & Edge Cases\n3. Verification Checklist',
  },
  {
    id: 'few-shot-boundary',
    name: 'Boundary Few-Shot',
    summary: 'Anchors edge-case behavior with one normal example and one tricky refusal/null case.',
    systemSnippet:
      'Match the exact structure and conservatism demonstrated in the examples. When required data is absent, output null instead of guessing.',
    promptSnippet:
      'Example (Complete): "Server down since 09:00 UTC" -> {"severity":"high","timestamp":"09:00 UTC"}\nExample (Ambiguous): "Things feel slow lately" -> {"severity":"low","timestamp":null}\n\nNow process:',
  },
  {
    id: 'vibe-architecture',
    name: 'Vibe-Code Build Plan',
    summary: 'Forces Gemini to scope an implementable MVP with routes, state, and UI components.',
    systemSnippet:
      'You are designing an MVP for a 3-hour solo build. Avoid over-engineering; focus on end-to-end working user value.',
    promptSnippet:
      'Scope this challenge into:\n- Primary user action (1 screen)\n- Client state & persistence\n- 2-3 API endpoints\n- Verification steps to prove it works.',
  },
  {
    id: 'self-critique',
    name: 'Pre-Submit Self-Audit',
    summary: 'Asks the model to test its own output against hidden failure modes.',
    systemSnippet:
      'Evaluate solutions adversarially. Identify brittle assumptions, ambiguous wording, and missing validation.',
    promptSnippet:
      'Review the proposed solution above and list:\n1. Top 3 failure modes\n2. Specific prompt edits to prevent each failure.',
  },
];

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  {
    id: 'reg-account',
    phase: 'Before Kickoff',
    label: 'Complete registration on Hack2Skill',
    detail:
      'Sign in to hack2skill.com with your personal account and confirm your solo registration on the PromptWars X AI Vibeathon 2026 event page.',
    completed: false,
  },
  {
    id: 'reg-confirm',
    phase: 'Before Kickoff',
    label: 'Verify event schedule & submission portal rules',
    detail:
      'Confirm the 25 November 2026 kickoff time, submission deadline, and allowed deliverables (prompt log, repo/live URL, or writeup).',
    completed: false,
  },
  {
    id: 'prep-templates',
    phase: 'Before Kickoff',
    label: 'Test CardioCalm Agent Demo & Prompt Lab',
    detail:
      'Run the Acute Alert scenario in the Agent Demo tab and execute your Cardiac Risk + EMS prompt in Prompt Lab to capture verified output.',
    completed: false,
  },
  {
    id: 'sprint-paste',
    phase: 'During Sprint',
    label: 'Verify all 3 pillars against the problem statement',
    detail:
      'Confirm your demo and prompt cover cardiac event prediction, patient calming/de-escalation, and emergency response coordination.',
    completed: false,
  },
  {
    id: 'sprint-iterate',
    phase: 'During Sprint',
    label: 'Run AI Judge Critique & compare v1 vs v2',
    detail:
      'Use the Prompt Evaluator to catch clinical safety blind spots and missing edge cases, then save the winning revision to your Submission Draft.',
    completed: false,
  },
  {
    id: 'submit-export',
    phase: 'Before Submitting',
    label: 'Polish rationale & export final submission bundle',
    detail:
      'Verify your final prompt, sample output, and demo URL in the Submission tab, then export Markdown/JSON to paste into Hack2Skill before the cutoff.',
    completed: false,
  },
];

export const DEFAULT_SUBMISSION: SubmissionDraft = {
  participantName: '',
  participantEmail: 'prachiamahajan192008@gmail.com',
  hack2skillHandle: '',
  projectTitle: 'CardioCalm — Predictive Cardiac Triage, De-escalation & EMS Coordination Agent',
  problemStatement: CARDIAC_PROBLEM_STATEMENT,
  strategyRationale:
    'CardioCalm decomposes the problem into three strictly separated yet synchronized AI responsibilities: (1) Structured Risk Triage using wearable vitals (HR, HRV drop, BP, SpO2) and symptom flags mapped to deterministic JSON schemas so the model never hallucinates clinical thresholds; (2) Calm De-escalation pairing an interactive 4-7-8 breathing pacer with short, non-alarmist grounding dialogue tailored to the live triage state; and (3) One-Click Emergency Coordination that compiles a scannable EMS dispatcher script, family SMS alert, and responder-readiness checklist.',
  finalSystemPrompt: CARDIAC_SYSTEM_PROMPT,
  finalUserPrompt: CARDIAC_USER_PROMPT,
  verifiedOutput: '',
  toolsUsed: 'Google AI Studio, Gemini 4 Hydrogen (@google/genai), React + Express',
  demoNotes: 'Interactive 3-pillar prototype live in the Agent Demo tab of PromptWars Studio.',
  updatedAt: '',
};
