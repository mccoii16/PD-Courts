import React from 'react';
import { NavigationTab } from '../../types';
import { Calendar, Users, Radio, Trophy, Settings, Sun, Moon, Cloud, LogIn, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';

export interface NavbarProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  activeMatchCount?: number;
  user?: User | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  isDark,
  onToggleTheme,
  activeMatchCount = 0,
  user,
  onSignIn,
  onSignOut,
}) => {
  const tabs: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'live', label: 'Live Matches', icon: <Radio className="w-5 h-5" />, badge: activeMatchCount },
    { id: 'events', label: 'Events', icon: <Calendar className="w-5 h-5" /> },
    { id: 'players', label: 'Players', icon: <Users className="w-5 h-5" /> },
    { id: 'scores', label: 'Scores', icon: <Trophy className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Top Header Bar for Desktop & Tablet */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm font-black text-xl shrink-0">
                P
              </div>
              <div className="min-w-0">
                <span className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight text-neutral-950 dark:text-white truncate block">
                  PDC
                </span>
                <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  Open Play
                </span>
              </div>
            </div>

            {/* Desktop & Tablet Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0">
              {tabs.map((tab) => {
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange(tab.id)}
                    className={`relative min-h-[46px] px-3 lg:px-4 py-2 rounded-xl text-sm lg:text-base font-bold flex items-center gap-2 lg:gap-2.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                    }`}
                  >
                    <span className="shrink-0">{tab.icon}</span>
                    <span className="whitespace-nowrap leading-none">{tab.label}</span>
                    {typeof tab.badge === 'number' && tab.badge > 0 && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-extrabold shrink-0 whitespace-nowrap ${
                          isActive
                            ? 'bg-emerald-500 text-white dark:bg-emerald-600 dark:text-white'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Actions: Cloud Sync, Auth, Theme Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              {user ? (
                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 whitespace-nowrap shrink-0">
                    <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="whitespace-nowrap">Firebase Synced</span>
                  </div>

                  <span className="hidden sm:inline-block text-xs font-semibold text-neutral-600 dark:text-neutral-300 max-w-[120px] truncate whitespace-nowrap shrink-0" title={user.email || user.displayName || ''}>
                    {user.displayName || user.email?.split('@')[0]}
                  </span>

                  {onSignOut && (
                    <button
                      type="button"
                      onClick={onSignOut}
                      title="Sign Out"
                      className="min-h-[42px] px-2.5 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden sm:inline whitespace-nowrap">Sign Out</span>
                    </button>
                  )}
                </div>
              ) : (
                onSignIn && (
                  <button
                    type="button"
                    onClick={onSignIn}
                    className="min-h-[42px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all whitespace-nowrap shrink-0"
                  >
                    <LogIn className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap leading-none">Sign In</span>
                  </button>
                )
              )}

              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="min-h-[46px] min-w-[46px] flex items-center justify-center rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer shrink-0"
              >
                {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-neutral-700" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Thumb Friendly) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 px-2 py-1 safe-area-pb">
        <div className="grid grid-cols-5 items-center gap-1">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer min-h-[52px] ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
                    : 'text-neutral-500 dark:text-neutral-400 font-semibold hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <div className="relative">
                  {tab.icon}
                  {typeof tab.badge === 'number' && tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-emerald-600 text-white rounded-full text-[10px] flex items-center justify-center font-black">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] tracking-tight mt-1 truncate max-w-[62px]">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
