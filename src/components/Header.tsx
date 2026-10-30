import React from 'react';
import { Menu, Upload, Plus, FlaskConical, Sparkles, MessageSquare } from 'lucide-react';
import { PageId } from '../types';

interface HeaderProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenPdfImport: () => void;
  onOpenMobileSidebar: () => void;
  perfumeCount: number;
  unreadChatCount?: number;
}

const PAGE_TITLES: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Kprime Dashboard',
    subtitle: 'Perfume inventory overview, formulation analytics & compounding tools',
  },
  database: {
    title: 'Perfume Database',
    subtitle: 'Comprehensive fragrance catalog with olfactory notes and search',
  },
  'add-perfume': {
    title: 'Add Perfume',
    subtitle: 'Register and catalog new fragrance compositions',
  },
  calculator: {
    title: 'Kprime Mixing Calculator',
    subtitle: 'High-precision 1 to 4 oils formulation mixing engine with Category pricing',
  },
  'similar-perfume': {
    title: 'Similar Perfume Finder',
    subtitle: 'Web research & olfactory comparison to find Top 5 matching Kprime database perfumes',
  },
  chat: {
    title: 'Team Chat',
    subtitle: 'Shared real-time communication for atelier compounding & team updates',
  },
  history: {
    title: 'Mixing History',
    subtitle: 'Permanent batch formulations, dispensing logs and customer formulas',
  },
  reports: {
    title: 'Reports & Tracking',
    subtitle: 'Daily Sales Man audit reports, mix logs and team revenue comparisons',
  },
  'sales-team': {
    title: 'Sales Team Management',
    subtitle: 'Manage shop staff, track individual formulators and monitor productivity',
  },
  settings: {
    title: 'Atelier Settings',
    subtitle: 'Configure oil/alcohol densities, bottle sizes and database backup',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  onOpenPdfImport,
  onOpenMobileSidebar,
  perfumeCount,
  unreadChatCount = 0,
}) => {
  const meta = PAGE_TITLES[currentPage] || PAGE_TITLES.dashboard;

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200 px-4 lg:px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          id="open-mobile-sidebar-btn"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="font-serif-luxury text-xl lg:text-2xl font-bold text-stone-900 tracking-wide">
            {meta.title}
          </h2>
          <p className="text-xs text-stone-500 hidden sm:block">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {currentPage !== 'chat' && (
          <button
            id="header-chat-shortcut"
            onClick={() => onNavigate('chat')}
            className="relative flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 text-xs sm:text-sm font-semibold transition-all shadow-xs"
            title="Open Team Chat"
          >
            <MessageSquare className="w-4 h-4 text-emerald-700" />
            <span className="hidden xs:inline">Team</span> Chat
            {unreadChatCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-600 text-white animate-pulse">
                {unreadChatCount}
              </span>
            )}
          </button>
        )}

        {currentPage !== 'calculator' && (
          <button
            id="header-calculator-shortcut"
            onClick={() => onNavigate('calculator')}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 text-xs sm:text-sm font-semibold transition-all"
          >
            <FlaskConical className="w-4 h-4 text-emerald-700" />
            <span className="hidden xs:inline">Open</span> Calculator
          </button>
        )}

        {currentPage !== 'add-perfume' && (
          <button
            id="header-add-perfume-shortcut"
            onClick={() => onNavigate('add-perfume')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 text-xs sm:text-sm font-semibold transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-700" />
            <span>Add Perfume</span>
          </button>
        )}

        <button
          id="header-import-pdf-btn"
          onClick={onOpenPdfImport}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm"
        >
          <Upload className="w-4 h-4" />
          <span>Import PDF</span>
        </button>
      </div>
    </header>
  );
};
