"use client";

import { useTransition } from 'react';
import { useRouter, usePathname } from '@/i18n/routing';

export default function LanguageToggle({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const nextLocale = currentLocale === 'es' ? 'en' : 'es';
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className="fixed top-6 right-6 z-50">
      <button 
        onClick={toggleLanguage}
        disabled={isPending}
        className="relative inline-flex items-center h-8 rounded-full w-16 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-200 shadow-inner"
      >
        <span className="sr-only">Toggle language</span>
        <span 
          className={`absolute left-1 flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 font-bold text-xs ${
            currentLocale === 'en' ? 'translate-x-8 text-blue-600' : 'translate-x-0 text-red-600'
          }`}
        >
          {['es', 'en'].includes(currentLocale) ? currentLocale.toUpperCase() : 'ES'}
        </span>
      </button>
    </div>
  );
}
