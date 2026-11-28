import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CareAppView } from './components/CareAppView';
import { OverviewView } from './components/OverviewView';
import { PricingView } from './components/PricingView';
import { ResilientImage } from './components/ResilientImage';
import { SafetyView } from './components/SafetyView';
import type { AppSection } from './types';

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('overview');
  const [selectedPlanForTrial, setSelectedPlanForTrial] = useState<string>('family');

  const navigateTo = (section: AppSection) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartTrial = (planId?: string) => {
    if (planId) {
      setSelectedPlanForTrial(planId);
    }
    navigateTo('pricing');
  };

  const navItems: { id: AppSection; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'care', label: 'Live Care App' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'safety', label: 'Safety' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8] text-[#0B1320]">
      {/* 3-Zone Top Bar Contract */}
      <header className="bg-white/95 backdrop-blur border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => navigateTo('overview')}
            className="inline-flex items-center gap-2.5 text-xl font-editorial font-semibold tracking-tight text-[#0B1320] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ResilientImage
              src="/src/assets/images/cardiocalm_logo_mark_1795628518643.jpg"
              alt="CardioCalm logo"
              className="w-8 h-8 rounded-lg object-cover shrink-0"
            />
            <span>CardioCalm</span>
          </button>

          <nav
            aria-label="Primary navigation"
            className="flex items-center gap-6 overflow-x-auto"
          >
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`py-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'border-teal-700 text-[#0B1320]'
                      : 'border-transparent text-slate-600 hover:text-[#0B1320]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => handleStartTrial('individual')}
              className="px-4 py-2 text-xs font-medium text-white bg-teal-700 rounded-xl hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeSection === 'overview' && (
              <OverviewView
                onNavigate={navigateTo}
                onStartTrial={handleStartTrial}
              />
            )}

            {activeSection === 'care' && <CareAppView />}

            {activeSection === 'pricing' && (
              <PricingView initialSelectedPlanId={selectedPlanForTrial} />
            )}

            {activeSection === 'safety' && <SafetyView />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-slate-200/80 bg-white mt-14">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="inline-flex items-center gap-2.5">
            <ResilientImage
              src="/src/assets/images/cardiocalm_logo_mark_1795628518643.jpg"
              alt="CardioCalm logo"
              className="w-5 h-5 rounded object-cover shrink-0"
            />
            <span>CardioCalm · Personal Cardiac Safety &amp; Care Companion</span>
          </div>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => navigateTo('care')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Live Care App
            </button>
            <button
              type="button"
              onClick={() => navigateTo('pricing')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => navigateTo('safety')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Safety &amp; Privacy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
