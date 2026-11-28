import { useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PRICING_TIERS } from '../data/plans';
import type { AppSection } from '../types';
import { ResilientImage } from './ResilientImage';

interface OverviewViewProps {
  onNavigate: (section: AppSection) => void;
  onStartTrial: (planId?: string) => void;
}

export function OverviewView({ onNavigate, onStartTrial }: OverviewViewProps) {
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadWearable, setLeadWearable] = useState('Apple Watch');
  const [submitting, setSubmitting] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);

  const handleQuickTrialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setLeadError(null);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: leadName,
          email: leadEmail,
          wearable: leadWearable,
          planName: 'Individual Care (14-Day Trial)',
          inquiryType: 'trial',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not start trial.');
      }
      setConfirmedRef(data.referenceCode);
      setLeadName('');
      setLeadEmail('');
    } catch (err) {
      setLeadError(err instanceof Error ? err.message : 'Unable to submit.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-16">
      {/* 1. Editorial Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-10 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="text-xs font-medium text-teal-700">
              Personal Cardiac Safety <span aria-hidden="true">·</span> 24/7 Wearable Triage
            </div>
            <h1 className="text-[clamp(2.25rem,4vw,3.5rem)] font-semibold tracking-tight text-[#0B1320] leading-[1.08] [text-wrap:balance]">
              Predict cardiac risk early. Stay calm. Coordinate care in seconds.
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              CardioCalm reads changes in heart rate, HRV, blood pressure, and symptoms—guiding paced breathing to steady panic while preparing an immediate handoff packet for family and emergency responders.
            </p>
          </div>

          <div className="pt-8 mt-8 border-t border-slate-100 space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('care')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-teal-700 rounded-xl hover:bg-teal-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Try Live Care App
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('pricing')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-slate-800 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                See Plans &amp; Pricing
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Compatible with Apple Watch, Oura Ring, Garmin, and Withings <span aria-hidden="true">·</span> 14-day free trial
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-slate-200/80 min-h-[360px] lg:min-h-[480px]">
          <ResilientImage
            src="/src/assets/images/hero_cardiac_wearable_1795628327398.jpg"
            alt="Smartwatch displaying heart rate rhythm on architectural stone"
            className="w-full h-full lg:h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1320]/90 via-[#0B1320]/25 to-transparent" />

          <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 text-white space-y-3">
            <div className="text-xs font-medium text-teal-300">
              Continuous Biometric Baseline
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/15">
              <div>
                <div className="text-[11px] text-slate-300">Heart Rate</div>
                <div className="text-xl font-mono font-semibold tabular-nums">
                  68 <span className="text-xs font-normal text-slate-300">bpm</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-300">HRV RMSSD</div>
                <div className="text-xl font-mono font-semibold tabular-nums">
                  52 <span className="text-xs font-normal text-slate-300">ms</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-300">SpO2</div>
                <div className="text-xl font-mono font-semibold tabular-nums">
                  99<span className="text-xs font-normal text-slate-300">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Asymmetric Capabilities Bento */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#0B1320] font-editorial">
              Built for the critical minutes before help arrives
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Most health trackers only log numbers after an event passes. CardioCalm pairs early pattern triage with immediate de-escalation and responder handoff.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('care')}
            className="text-sm font-medium text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Test interactive monitor →
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lead Wide Card */}
          <article className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 items-stretch">
            <div className="sm:col-span-6 p-7 flex flex-col justify-between space-y-5">
              <div className="space-y-2.5">
                <div className="text-xs text-slate-500">01. Early Event Prediction</div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Spot multi-signal warning patterns before panic sets in
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Combines resting heart rate spikes, sharp HRV drops, blood pressure surges, SpO2 dips, and self-reported symptoms into clear Nominal, Elevated, or High Alert triage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('care')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-800 w-fit cursor-pointer"
              >
                Run sample assessment
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="sm:col-span-6 min-h-[220px] bg-slate-100">
              <ResilientImage
                src="/src/assets/images/hero_cardiac_wearable_1795628327398.jpg"
                alt="Wearable heart rate sensor resting on limestone"
                className="w-full h-full object-cover"
              />
            </div>
          </article>

          {/* Tall Side Card */}
          <article className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col justify-between">
            <div className="aspect-[16/9] bg-slate-100">
              <ResilientImage
                src="/src/assets/images/calming_breath_sanctuary_1795628328357.jpg"
                alt="Calm sunlit room for guided 4-7-8 breathing"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-7 space-y-3">
              <div className="text-xs text-slate-500">02. Guided De-escalation</div>
              <h3 className="text-xl font-semibold text-slate-900">
                Steady your breathing and lower adrenaline spikes
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                A synchronized 4-7-8 pacer and calm companion dialogue help keep you seated, grounded, and clear-headed while symptoms are evaluated.
              </p>
            </div>
          </article>

          {/* Full-Width Bottom Feature Split */}
          <article className="lg:col-span-12 bg-[#0B1320] text-white rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-5 min-h-[240px]">
              <ResilientImage
                src="/src/assets/images/emergency_dispatch_console_1795628328870.jpg"
                alt="Emergency medical coordination console displaying route and vital metrics"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="text-xs text-teal-300">
                  03. Coordinated Emergency Handoff
                </div>
                <h3 className="text-2xl font-semibold tracking-tight">
                  One tap turns scattered vitals into an EMS-ready brief
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                  When symptoms escalate, CardioCalm compiles your latest vitals, onset timeline, medications, allergies, and entry-access instructions into a crisp script for dispatchers and an instant alert for your emergency contacts.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('care')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#0B1320] bg-white rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Preview Dispatch Brief
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('safety')}
                  className="text-sm font-medium text-teal-300 hover:text-teal-200 cursor-pointer"
                >
                  Read safety &amp; privacy architecture
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* 3. Transparent Pricing Preview */}
      <section className="space-y-6 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#0B1320] font-editorial">
              Simple plans for individuals, families, and clinics
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Every plan starts with a 14-day free trial and works with your existing smartwatch or ring.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('pricing')}
            className="text-sm font-medium text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Compare all plan limits →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`bg-white rounded-2xl p-6 flex flex-col justify-between border ${
                tier.featured ? 'border-teal-700' : 'border-slate-200/80'
              }`}
            >
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-500">{tier.audience}</div>
                  <h3 className="text-lg font-semibold text-slate-900 mt-0.5">
                    {tier.name}
                  </h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-slate-900 tabular-nums">
                    ${tier.annualMonthlyPrice}
                  </span>
                  <span className="text-xs text-slate-500">/ month billed annually</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{tier.summary}</p>
                <ul className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-700">
                  {tier.specs.map((spec) => (
                    <li key={spec.label} className="flex justify-between gap-2">
                      <span className="text-slate-500">{spec.label}</span>
                      <span className="font-medium text-slate-900 text-right">
                        {spec.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onStartTrial(tier.id)}
                className={`mt-6 w-full py-2.5 px-4 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                  tier.featured
                    ? 'bg-teal-700 text-white hover:bg-teal-800'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                }`}
              >
                {tier.ctaLabel}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Validated Trial / Onboarding Form */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-teal-700">
            <ShieldCheck className="w-4 h-4" />
            14-Day Free Trial · No Hardware Lock-In
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#0B1320] font-editorial">
            Start protecting yourself or an aging parent today
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed max-w-lg">
            Reserve your CardioCalm account and connect your preferred wearable in under three minutes. Cancel anytime during your trial.
          </p>
        </div>

        <div className="lg:col-span-6">
          {confirmedRef ? (
            <div className="p-6 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-teal-900">
                <CheckCircle2 className="w-5 h-5 text-teal-700" />
                Trial invitation reserved
              </div>
              <p className="text-xs text-teal-800 leading-relaxed">
                Your onboarding pass (<span className="font-mono font-semibold">{confirmedRef}</span>) is confirmed. You can explore the full monitor immediately inside the Live Care App tab.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('care')}
                  className="px-4 py-2 text-xs font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 cursor-pointer"
                >
                  Open Live Care App
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmedRef(null)}
                  className="text-xs font-medium text-teal-800 hover:underline cursor-pointer"
                >
                  Register another member
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleQuickTrialSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="trial-name" className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="trial-name"
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="Jordan Lee"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
                <div>
                  <label htmlFor="trial-email" className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="trial-email"
                    type="email"
                    required
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label htmlFor="trial-wearable" className="block text-xs font-medium text-slate-700 mb-1">
                    Primary Wearable
                  </label>
                  <select
                    id="trial-wearable"
                    value={leadWearable}
                    onChange={(e) => setLeadWearable(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                  >
                    <option value="Apple Watch">Apple Watch</option>
                    <option value="Oura Ring">Oura Ring</option>
                    <option value="Garmin">Garmin</option>
                    <option value="Withings">Withings</option>
                    <option value="Manual Cuff Only">Manual Blood Pressure Cuff</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-5 text-sm font-medium text-white bg-teal-700 rounded-xl hover:bg-teal-800 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submitting ? 'Reserving...' : 'Start 14-Day Free Trial'}
                </button>
              </div>

              {leadError && (
                <p className="text-xs text-rose-600">{leadError}</p>
              )}
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
