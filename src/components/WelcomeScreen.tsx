import React from 'react';
import { Wallet, Target, Sparkles, Compass, Mail, ArrowRight, ShieldCheck, Globe } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { BRAND, CONTACT } from '../config/brand';

const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M24 12.073C24 5.446 18.627 0 12 0S0 5.446 0 12.073C0 18.063 4.388 23.027 10.125 23.927v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.063 24 12.073z" />
  </svg>
);

const LinkedInIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
  </svg>
);

interface WelcomeScreenProps {
  onStartTour: () => void;
  onSkip: () => void;
}

const FEATURES = [
  {
    icon: Wallet,
    title: 'Track',
    body: 'Log income and expenses in seconds, with recurring entries handled for you.',
    accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
  },
  {
    icon: Target,
    title: 'Plan',
    body: '50/30/20 budgets, savings goals, emergency fund and debt payoff strategy.',
    accent: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60',
  },
  {
    icon: Sparkles,
    title: 'Understand',
    body: 'A financial stress score, 6-month trends and an AI coach reading your real numbers.',
    accent: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
  },
  {
    icon: Compass,
    title: 'Islamic guidance',
    body: 'Zakat calculator linked to your net worth, riba-free debt principles and barakah habits.',
    accent: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60',
  },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartTour, onSkip }) => {
  const socials = [
    CONTACT.facebook && { label: 'Facebook', href: CONTACT.facebook, Icon: FacebookIcon },
    CONTACT.linkedin && { label: 'LinkedIn', href: CONTACT.linkedin, Icon: LinkedInIcon },
    CONTACT.website && { label: 'Website', href: CONTACT.website, Icon: Globe },
  ].filter(Boolean) as Array<{
    label: string;
    href: string;
    Icon: React.ComponentType<{ className?: string }>;
  }>;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-50 dark:bg-slate-950">
      {/* Ambient background wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(60rem 40rem at 15% -10%, rgba(16,185,129,0.20), transparent 60%), radial-gradient(45rem 35rem at 95% 10%, rgba(13,148,136,0.18), transparent 60%), radial-gradient(40rem 30rem at 50% 110%, rgba(59,130,246,0.12), transparent 60%)',
        }}
      />

      <div className="relative mx-auto flex min-h-full w-full max-w-4xl flex-col px-5 py-10 sm:px-8 sm:py-14">
        {/* Hero */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 rounded-[28px] bg-emerald-500/30 blur-2xl"
            />
            <BrandLogo size={64} className="drop-shadow-sm sm:h-[88px] sm:w-[88px]" />
          </div>

          <div className="mt-5 inline-flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {BRAND.appName}
            </h1>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              PKR
            </span>
          </div>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
            {BRAND.tagline}
          </p>

          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Your data stays on your device unless you sign in to sync
          </div>
        </div>

        {/* Feature grid — icon + title only on phones, full copy from sm up */}
        <div className="mt-7 grid grid-cols-2 gap-2.5 sm:mt-11 sm:gap-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-xs backdrop-blur transition hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-emerald-800 sm:p-4"
              >
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:gap-3">
                  <div className={`rounded-xl p-2 ${feature.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                    <p className="mt-0.5 hidden text-xs leading-relaxed text-slate-600 dark:text-slate-400 sm:block">
                      {feature.body}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2.5 sm:mt-10 sm:flex-row sm:justify-center">
          <button
            onClick={onStartTour}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-[0.99]"
          >
            Take the 60-second tour
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={onSkip}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Skip, take me in
          </button>
        </div>

        {/* Credits */}
        <div className="mt-auto pt-10">
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-center backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Designed &amp; built by
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{BRAND.studio}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{BRAND.author}</p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <a
                href={`mailto:${CONTACT.email}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-emerald-400"
              >
                <Mail className="h-3.5 w-3.5" />
                {CONTACT.email}
              </a>

              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.label}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-emerald-400"
                >
                  <social.Icon className="h-3.5 w-3.5" />
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
