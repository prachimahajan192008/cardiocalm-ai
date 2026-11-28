import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { COMPARISON_ROWS, FAQS, PRICING_TIERS } from '../data/plans';

interface PricingViewProps {
  initialSelectedPlanId?: string;
}

export function PricingView({ initialSelectedPlanId }: PricingViewProps) {
  const [annualBilling, setAnnualBilling] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    initialSelectedPlanId || 'family'
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [wearable, setWearable] = useState('Apple Watch');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    referenceCode: string;
    planName: string;
    email: string;
  } | null>(null);

  const activeTier =
    PRICING_TIERS.find((t) => t.id === selectedPlanId) ?? PRICING_TIERS[1];

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          wearable,
          planName: `${activeTier.name} (${annualBilling ? 'Annual' : 'Monthly'})`,
          inquiryType: activeTier.id === 'clinic' ? 'clinic-demo' : 'trial',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not complete request.');
      }
      setConfirmation({
        referenceCode: data.referenceCode,
        planName: data.planName,
        email: data.email,
      });
      setFullName('');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-14">
      {/* Header & Billing Cadence Switch */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs font-medium text-teal-700">
            14-Day Free Trial on All Plans
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#0B1320] font-editorial [text-wrap:balance]">
            Transparent protection for individuals, families, and clinics.
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            No proprietary hardware required. Connect your existing watch or ring and start monitoring in minutes.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setAnnualBilling(true)}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              annualBilling
                ? 'bg-[#0B1320] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Annual (Save 25%)
          </button>
          <button
            type="button"
            onClick={() => setAnnualBilling(false)}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              !annualBilling
                ? 'bg-[#0B1320] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly
          </button>
        </div>
      </section>

      {/* Plan Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRICING_TIERS.map((tier) => {
          const price = annualBilling ? tier.annualMonthlyPrice : tier.monthlyPrice;
          const isSelected = selectedPlanId === tier.id;
          return (
            <div
              key={tier.id}
              className={`bg-white rounded-2xl p-7 flex flex-col justify-between border transition-colors ${
                isSelected
                  ? 'border-teal-700'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-500">{tier.audience}</div>
                  <h2 className="text-xl font-semibold text-slate-900 mt-0.5">
                    {tier.name}
                  </h2>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-semibold text-slate-900 tabular-nums">
                    ${price}
                  </span>
                  <span className="text-xs text-slate-500">
                    / month {annualBilling ? 'billed annually' : 'billed monthly'}
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">{tier.summary}</p>

                <ul className="space-y-2.5 pt-4 border-t border-slate-100 text-xs">
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
                onClick={() => {
                  setSelectedPlanId(tier.id);
                  setConfirmation(null);
                  document
                    .getElementById('trial-activation')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={`mt-7 w-full py-2.5 px-4 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-teal-700 text-white hover:bg-teal-800'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                }`}
              >
                {isSelected ? `Selected: ${tier.name}` : tier.ctaLabel}
              </button>
            </div>
          );
        })}
      </section>

      {/* Trial Activation / Checkout Reservation */}
      <section
        id="trial-activation"
        className="bg-white border border-slate-200/80 rounded-2xl p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
      >
        <div className="lg:col-span-5 space-y-2">
          <div className="text-xs font-medium text-teal-700">
            Selected Plan: {activeTier.name}
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 font-editorial">
            {activeTier.id === 'clinic'
              ? 'Schedule your clinical onboarding'
              : 'Activate your 14-day free trial'}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            ${annualBilling ? activeTier.annualMonthlyPrice : activeTier.monthlyPrice}
            /month after your 14-day trial. Cancel online anytime before billing begins.
          </p>
        </div>

        <div className="lg:col-span-7">
          {confirmation ? (
            <div className="p-6 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-teal-900">
                <CheckCircle2 className="w-5 h-5 text-teal-700" />
                Request Confirmed — {confirmation.planName}
              </div>
              <p className="text-xs text-teal-800 leading-relaxed">
                Confirmation reference{' '}
                <span className="font-mono font-semibold">
                  {confirmation.referenceCode}
                </span>{' '}
                created for {confirmation.email}.
              </p>
            </div>
          ) : (
            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="plan-name" className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="plan-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jordan Lee"
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
                <div>
                  <label htmlFor="plan-email" className="block text-xs font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    id="plan-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
                <div>
                  <label htmlFor="plan-wearable" className="block text-xs font-medium text-slate-700 mb-1">
                    Wearable Device
                  </label>
                  <select
                    id="plan-wearable"
                    value={wearable}
                    onChange={(e) => setWearable(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                  >
                    <option value="Apple Watch">Apple Watch</option>
                    <option value="Oura Ring">Oura Ring</option>
                    <option value="Garmin">Garmin</option>
                    <option value="Withings">Withings</option>
                    <option value="Clinic Multi-Device">Clinic Multi-Device</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                {error ? (
                  <p className="text-xs text-rose-600">{error}</p>
                ) : (
                  <span className="text-xs text-slate-500">
                    14-day free trial · Instant access to the Live Care App
                  </span>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-teal-700 rounded-xl hover:bg-teal-800 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submitting
                    ? 'Submitting...'
                    : activeTier.id === 'clinic'
                      ? 'Request Clinic Demo'
                      : 'Activate Free Trial'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Concrete Plan Limits Table */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Plan Specifications &amp; Limits
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-3 pr-4 font-medium">Capability</th>
                <th className="py-3 pr-4 font-medium">Individual Care</th>
                <th className="py-3 pr-4 font-medium">Family Shield</th>
                <th className="py-3 font-medium">Clinic &amp; Concierge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature} className="hover:bg-slate-50">
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    {row.feature}
                  </td>
                  <td className="py-3 pr-4 text-slate-600 tabular-nums">
                    {row.individual}
                  </td>
                  <td className="py-3 pr-4 text-slate-900 font-medium tabular-nums">
                    {row.family}
                  </td>
                  <td className="py-3 text-slate-600 tabular-nums">
                    {row.clinic}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 font-editorial">
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FAQS.map((item) => (
            <div
              key={item.q}
              className="bg-white border border-slate-200/80 rounded-xl p-6 space-y-2"
            >
              <h3 className="text-sm font-semibold text-slate-900">{item.q}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
