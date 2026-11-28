export type AppSection = 'overview' | 'care' | 'pricing' | 'safety';

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

export interface AssessmentHistoryEntry {
  id: string;
  timestamp: string;
  heartRate: number;
  hrvMs: number;
  bloodPressure: string;
  spo2: number;
  riskTier: CardiacAssessment['riskTier'];
  headline: string;
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

export interface EmergencyProfile {
  patientName: string;
  locationNote: string;
  emergencyContact: string;
  medicalNotes: string;
}

export interface PricingTier {
  id: string;
  name: string;
  audience: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  summary: string;
  featured?: boolean;
  specs: { label: string; value: string }[];
  ctaLabel: string;
}
