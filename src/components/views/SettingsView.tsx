import React from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Settings as SettingsIcon, Sun, Moon, Shield, Sliders, RotateCcw } from 'lucide-react';

export interface SettingsViewProps {
  isDark: boolean;
  onToggleTheme: () => void;
  courtsCount: number;
  onUpdateCourtsCount: (count: number) => void;
  onResetSampleData: () => void;
  onLoadDemoData?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isDark,
  onToggleTheme,
  courtsCount,
  onUpdateCourtsCount,
  onResetSampleData,
  onLoadDemoData,
}) => {
  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 rounded-2xl shadow-sm">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950 dark:text-white">
          Settings & Preferences
        </h1>
        <p className="mt-1 text-base sm:text-lg text-neutral-600 dark:text-neutral-400">
          Organizer controls for courts, display, and open-play defaults
        </p>
      </div>

      {/* Courts Setup */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-neutral-950 dark:text-white">
              Courts Management
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Adjust the active court capacity for this venue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-3">
          <span className="text-base font-bold text-neutral-800 dark:text-neutral-200">
            Available Courts:
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={courtsCount <= 1}
              onClick={() => onUpdateCourtsCount(Math.max(1, courtsCount - 1))}
              className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-bold text-xl flex items-center justify-center disabled:opacity-40 cursor-pointer"
            >
              -
            </button>
            <span className="text-2xl font-black tabular-nums min-w-[32px] text-center">
              {courtsCount}
            </span>
            <button
              type="button"
              disabled={courtsCount >= 16}
              onClick={() => onUpdateCourtsCount(Math.min(16, courtsCount + 1))}
              className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-bold text-xl flex items-center justify-center disabled:opacity-40 cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          Supports any number of courts and players. Matches will scale to your selected capacity.
        </p>
      </div>

      {/* Appearance / Theme */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
              {isDark ? <Moon className="w-5 h-5 text-amber-400" /> : <Sun className="w-5 h-5 text-neutral-700" />}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-neutral-950 dark:text-white">
                Appearance Mode
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Optimized for high-contrast indoor and bright outdoor courts
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={onToggleTheme}
            icon={isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          >
            {isDark ? 'Switch to Light' : 'Switch to Dark'}
          </Button>
        </div>
      </div>

      {/* Match Rules Placeholder */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-neutral-950 dark:text-white">
              Default Match Rules
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Scoring format guidelines for this session
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">
              Game Format
            </span>
            <span className="text-base font-bold text-neutral-900 dark:text-white">
              Standard 11 Points (Win by 2)
            </span>
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">
              Matchup Mode
            </span>
            <span className="text-base font-bold text-neutral-900 dark:text-white">
              Fairly Random 2v2 Open Play
            </span>
          </div>
        </div>
      </div>

      {/* Reset / Clear Session Data */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-neutral-950 dark:text-white">
              Session Roster & Matches
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Clear current session data to start with a completely empty roster and courts
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onLoadDemoData && (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  if (confirm('Load sample demo players and matches for testing?')) {
                    onLoadDemoData();
                  }
                }}
              >
                Load Demo Data
              </Button>
            )}

            <Button
              variant="danger"
              size="md"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={() => {
                if (confirm('Clear all players, live games, and match history to start completely fresh?')) {
                  onResetSampleData();
                }
              }}
            >
              Clear All Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
