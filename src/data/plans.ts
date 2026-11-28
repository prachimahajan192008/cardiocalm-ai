import type { EmergencyProfile, PricingTier } from '../types';

export const DEFAULT_EMERGENCY_PROFILE: EmergencyProfile = {
  patientName: 'Alex Morgan',
  locationNote: 'Apartment 4B, 210 Cedar Ave · Smart lock code #4490',
  emergencyContact: 'Maya Morgan (Spouse) · (415) 555-0194',
  medicalNotes: 'Mild hypertension (Lisinopril 10mg) · No known drug allergies',
};

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'individual',
    name: 'Individual Care',
    audience: 'For personal daily protection',
    monthlyPrice: 19,
    annualMonthlyPrice: 14,
    summary:
      'Continuous wearable trend monitoring, calming breathing guidance, and personal emergency dispatch briefs.',
    specs: [
      { label: 'Wearable Sync', value: '1 primary watch or ring' },
      { label: 'Risk Triage Runs', value: 'Unlimited 24/7 checks' },
      { label: 'Emergency Contacts', value: 'Up to 2 designated contacts' },
      { label: 'Calming Companion', value: 'Guided 4-7-8 & live dialogue' },
    ],
    ctaLabel: 'Start 14-Day Trial',
  },
  {
    id: 'family',
    name: 'Family Shield',
    audience: 'For households & caregivers',
    monthlyPrice: 39,
    annualMonthlyPrice: 29,
    summary:
      'Protect parents and loved ones under one shared caregiver dashboard with instant alert handoff packets.',
    featured: true,
    specs: [
      { label: 'Member Profiles', value: 'Up to 5 family members' },
      { label: 'Risk Triage Runs', value: 'Unlimited 24/7 checks' },
      { label: 'Emergency Contacts', value: 'Up to 10 family & local alerts' },
      { label: 'Caregiver Handoff', value: 'Shared meds, allergies & access' },
    ],
    ctaLabel: 'Start Family Trial',
  },
  {
    id: 'clinic',
    name: 'Clinic & Concierge',
    audience: 'For preventive cardiology teams',
    monthlyPrice: 129,
    annualMonthlyPrice: 99,
    summary:
      'Deploy CardioCalm across outpatient recovery cohorts with structured clinician summaries and custom thresholds.',
    specs: [
      { label: 'Patient Seats', value: 'Up to 25 active patients' },
      { label: 'Risk Triage Runs', value: 'Unlimited + custom baselines' },
      { label: 'Clinical Exports', value: 'Structured PDF & JSON summaries' },
      { label: 'Onboarding', value: 'Dedicated setup & SLA support' },
    ],
    ctaLabel: 'Book Clinic Demo',
  },
];

export const COMPARISON_ROWS: {
  feature: string;
  individual: string;
  family: string;
  clinic: string;
}[] = [
  {
    feature: 'Monitored Member Profiles',
    individual: '1 member',
    family: 'Up to 5 members',
    clinic: 'Up to 25 patients',
  },
  {
    feature: 'Supported Wearables',
    individual: 'Apple Watch, Oura, Garmin, Withings',
    family: 'All wearables per member',
    clinic: 'All wearables + clinic CSV/API',
  },
  {
    feature: 'Emergency Contact Alerts',
    individual: '2 contacts',
    family: '10 contacts',
    clinic: 'Unlimited care-team routing',
  },
  {
    feature: 'EMS Dispatcher Script Generation',
    individual: 'Included',
    family: 'Included',
    clinic: 'Included + custom facility notes',
  },
  {
    feature: 'Guided 4-7-8 De-escalation & Companion',
    individual: '24/7 access',
    family: '24/7 access',
    clinic: '24/7 access',
  },
  {
    feature: 'Assessment History Retention',
    individual: '90 days',
    family: '1 year',
    clinic: '3 years + audit log',
  },
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: 'Which wearables work with CardioCalm?',
    a: 'CardioCalm reads resting heart rate, HRV (RMSSD), SpO2, and blood pressure entries synced from Apple Watch, Oura Ring, Garmin, and Withings Health Mate, alongside manual cuff readings.',
  },
  {
    q: 'Does CardioCalm replace 911 or emergency medical services?',
    a: 'No. CardioCalm provides early biometric risk awareness, calming breathing guidance, and structured responder summaries so you or a loved one can communicate clearly with emergency dispatchers.',
  },
  {
    q: 'How is my health and location data protected?',
    a: 'Your emergency profile, medication list, and access notes are stored securely and shared only when you explicitly generate or send an emergency handoff packet.',
  },
  {
    q: 'Can I cancel during the 14-day free trial?',
    a: 'Yes. You can switch plans or cancel at any point during the 14-day trial with no commitment.',
  },
];
