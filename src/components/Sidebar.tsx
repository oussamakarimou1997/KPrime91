import React from 'react';
import {
  LayoutDashboard,
  Database,
  PlusCircle,
  FlaskConical,
  History,
  Settings as SettingsIcon,
  Upload,
  Sparkles,
  X,
  Users,
  BarChart3,
  MessageSquare,
  Droplets,
} from 'lucide-react';
import { PageId, AppSettings } from '../types';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  perfumeCount: number;
  historyCount: number;
  salesmenCount?: number;
  unreadChatCount?: number;
  settings?: AppSettings;
  onOpenPdfImport?: () => void;
  isOpenMobile?: boolean;
  mobileOpen?: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  perfumeCount,
  historyCount,
  salesmenCount = 0,
  unreadChatCount = 0,
  settings = { oilDensity: 1.0, alcoholDensity: 0.789, bottleSizes: [9.8, 15, 36, 55, 59, 86, 105], defaultConcentration: 30, roundingPrecision: 2 },
  onOpenPdfImport,
  isOpenMobile,
  mobileOpen,
  onCloseMobile,
}) => {
  const isMobileActive = mobileOpen !== undefined ? mobileOpen : (isOpenMobile || false);

  const navItems: Array<{
    id: PageId;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    isPrimary?: boolean;
    subtitle?: string;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'calculator',
      label: 'Mixing Calculator',
      icon: FlaskConical,
      isPrimary: true,
      subtitle: 'Core Formulator',
    },
    {
      id: 'oil-tracker',
      label: 'Oil Tracker',
      icon: Droplets,
      subtitle: 'Inventory & Balance',
    },
    {
      id: 'similar-perfume',
      label: 'Similar Perfume',
      icon: Sparkles,
      subtitle: 'Finder & Matching',
      badge: 'AI',
    },
    {
      id: 'history',
      label: 'Mixing History',
      icon: History,
      badge: historyCount,
    },
    {
      id: 'reports',
      label: 'Reports & Tracking',
      icon: BarChart3,
    },
    {
      id: 'sales-team',
      label: 'Sales Team',
      icon: Users,
      badge: salesmenCount > 0 ? salesmenCount : undefined,
    },
    {
      id: 'database',
      label: 'Perfume Database',
      icon: Database,
      badge: perfumeCount,
    },
    {
      id: 'add-perfume',
      label: 'Add Perfume',
      icon: PlusCircle,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsIcon,
    },
  ];

  const handleItemClick = (id: PageId) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileActive && (
        <div
          id="mobile-sidebar-backdrop"
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-stone-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileActive ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-0.5 shadow-md shadow-emerald-800/20 flex items-center justify-center flex-shrink-0">
              <div className="w-full h-full bg-emerald-950 rounded-[10px] flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="font-serif-luxury text-lg font-bold tracking-wide text-stone-900 leading-tight">
                Kprime
              </h1>
              <p className="text-[10px] tracking-widest text-emerald-700 uppercase font-semibold">
                Perfume Atelier
              </p>
            </div>
          </div>
          <button
            id="close-mobile-sidebar-btn"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action: PDF Upload Banner */}
        {onOpenPdfImport && (
          <div className="px-3 pt-3">
            <button
              id="sidebar-pdf-import-btn"
              onClick={() => {
                onOpenPdfImport();
                onCloseMobile();
              }}
              className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-50 via-emerald-100/40 to-stone-50 border border-emerald-200 p-2.5 text-left transition-all hover:border-emerald-300 hover:shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-200/70 text-emerald-900 group-hover:scale-105 transition-transform flex-shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-emerald-950 flex items-center gap-1">
                    Import PDF Catalog
                    <Sparkles className="w-3 h-3 text-emerald-600 inline" />
                  </div>
                  <div className="text-[10px] text-stone-500 truncate">Extract & sync database</div>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider font-bold text-stone-400">
            Main Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? item.isPrimary
                      ? 'bg-emerald-700 text-white font-bold shadow-md shadow-emerald-700/30'
                      : 'bg-emerald-50 text-emerald-950 border border-emerald-300 font-bold'
                    : item.isPrimary
                    ? 'bg-emerald-50/80 text-emerald-950 hover:bg-emerald-100 border border-emerald-200 font-semibold'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105 ${
                      isActive
                        ? item.isPrimary
                          ? 'text-white'
                          : 'text-emerald-700'
                        : item.isPrimary
                        ? 'text-emerald-700'
                        : 'text-stone-500 group-hover:text-stone-800'
                    }`}
                  />
                  <div className="text-left truncate">
                    <span className="block truncate">{item.label}</span>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${
                      item.id === 'chat'
                        ? 'bg-emerald-600 text-white shadow-2xs animate-pulse'
                        : isActive
                        ? item.isPrimary
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-200 text-emerald-950'
                        : 'bg-stone-200 text-stone-700 group-hover:bg-stone-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Current Formulation Density Indicator */}
        <div className="p-3 border-t border-stone-200 bg-stone-50/80">
          <div className="rounded-xl bg-white border border-stone-200 p-2.5 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-[10px] text-stone-500">
              <span className="font-semibold">Active Densities:</span>
              <button
                id="sidebar-settings-shortcut"
                onClick={() => handleItemClick('settings')}
                className="text-emerald-700 hover:underline hover:text-emerald-800 font-semibold"
              >
                Configure
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              <div className="bg-stone-50 rounded-lg px-2 py-1 border border-stone-200">
                <span className="text-[9px] text-stone-500 block uppercase font-bold">Oil</span>
                <span className="text-emerald-800 font-bold text-[11px]">{settings.oilDensity.toFixed(2)} g/ml</span>
              </div>
              <div className="bg-stone-50 rounded-lg px-2 py-1 border border-stone-200">
                <span className="text-[9px] text-stone-500 block uppercase font-bold">Alcohol</span>
                <span className="text-teal-800 font-bold text-[11px]">{settings.alcoholDensity.toFixed(3)} g/ml</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
