import { useState } from 'react';
import { CheckCircle2, Lock, ShieldCheck, Watch } from 'lucide-react';

export function SafetyView() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name,
          email,
          planName: organization ? `Clinical Inquiry (${organization})` : 'Clinical Safety Inquiry',
          inquiryType: 'clinical-safety',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not submit inquiry.');
      }
      setRefCode(data.referenceCode);
      setName('');
      setEmail('');
      setOrganization('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 max-w-5xl">
      <section className="space-y-3">
        <div className="text-xs font-medium text-teal-700">
          Clinical Boundaries &amp; Privacy Architecture
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#0B1320] font-editorial [text-wrap:balance]">
          Designed for calm clarity, strict medical honesty, and user-controlled data.
        </h1>
        <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
          CardioCalm is built to bridge the gap between early biometric anomalies and professional care without false diagnoses or alarmist noise.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-3">
          <ShieldCheck className="w-5 h-5 text-teal-700" />
          <h2 className="text-base font-semibold text-slate-900">
            Decision Support, Not Diagnosis
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Risk tiers (Nominal, Elevated, High Alert) highlight multi-signal deviations and prompt timely physician consultation or emergency dialing—never claiming a clinical diagnosis.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-3">
          <Lock className="w-5 h-5 text-teal-700" />
          <h2 className="text-base font-semibold text-slate-900">
            User-Controlled Emergency Sharing
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Location notes, medications, allergies, and contact alerts are stored in your private profile and formatted into a handoff brief only when you choose to coordinate care.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-3">
          <Watch className="w-5 h-5 text-teal-700" />
          <h2 className="text-base font-semibold text-slate-900">
            Wearable &amp; Cuff Agnostic
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Works alongside Apple Watch, Oura Ring, Garmin, and Withings telemetry as well as standard home blood pressure cuffs and pulse oximeters.
          </p>
        </div>
      </section>

      <section className="bg-white border border-slate-200/80 rounded-2xl p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">
            Partner with CardioCalm for outpatient or caregiver programs
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Request our security overview or schedule a walkthrough with our clinical partnerships team.
          </p>
        </div>

        <div className="lg:col-span-6">
          {refCode ? (
            <div className="p-5 bg-teal-50 border border-teal-200 rounded-xl space-y-1.5">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-teal-900">
                <CheckCircle2 className="w-4 h-4 text-teal-700" />
                Inquiry received ({refCode})
              </div>
              <p className="text-xs text-teal-800">
                Our team will follow up with the documentation package shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleInquiry} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  aria-label="Your name"
                  className="px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Work email"
                  aria-label="Work email"
                  className="px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Clinic or organization (optional)"
                  aria-label="Clinic or organization"
                  className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-[#0B1320] rounded-xl hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {submitting ? 'Sending...' : 'Request Security Brief'}
                </button>
              </div>
              {error && <p className="text-xs text-rose-600">{error}</p>}
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
