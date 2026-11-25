export type WorkspaceTab = 'overview' | 'agent' | 'lab' | 'submission' | 'readiness';

export interface ChallengeScenario {
  id: string;
  title: string;
  category: string;
  timeboxMinutes: number;
  difficulty: 'Practice' | 'Sprint' | 'Live Kickoff';
  brief: string;
  constraints: string[];
  starterSystemInstruction: string;
  starterPrompt: string;
  isCustom?: boolean;
}

export interface PromptPattern {
  id: string;
  name: string;
  summary: string;
  systemSnippet: string;
  promptSnippet: string;
}

export interface PromptRevision {
  id: string;
  timestamp: string;
  challengeId: string;
  challengeTitle: string;
  systemInstruction: string;
  prompt: string;
  jsonMode: boolean;
  output: string;
  latencyMs: number;
  wordCount: number;
}

export interface CritiqueResult {
  summary: string;
  strengths: string[];
  blindSpots: string[];
  edgeCases: string[];
  improvedPrompt: string;
}

export interface SubmissionDraft {
  participantName: string;
  participantEmail: string;
  hack2skillHandle: string;
  projectTitle: string;
  problemStatement: string;
  strategyRationale: string;
  finalSystemPrompt: string;
  finalUserPrompt: string;
  verifiedOutput: string;
  toolsUsed: string;
  demoNotes: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  phase: 'Before Kickoff' | 'During Sprint' | 'Before Submitting';
  label: string;
  detail: string;
  completed: boolean;
}

export interface VitalsSnapshot {
  heartRate: number;
  hrvMs: number;
  systolicBp: number;
  diastolicBp: number;
  spo2: number;
  symptoms: string[];
  contextNotes: string;
}

export interface CardiacAssessment {
  riskTier: 'Nominal' | 'Elevated' | 'High Alert';
  headline: string;
  earlySignals: string[];
  immediateGuidance: string[];
  escalationAction: string;
  calmingOpening: string;
}

export interface CalmMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export interface DispatchPacket {
  emsScript: string;
  contactAlertMessage: string;
  responderChecklist: string[];
}
