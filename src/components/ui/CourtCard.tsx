import React, { useState, useEffect } from 'react';
import { Match, SKILL_LEVEL_SHORT_LABELS } from '../../types';
import { StatusBadge } from './StatusBadge';
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Play,
  Plus,
  Minus,
  Clock,
  Edit2,
  RefreshCw,
} from 'lucide-react';

export interface CourtCardProps {
  courtName: string;
  match?: Match | null;
  onScoreChange?: (matchId: string, team: 1 | 2, delta: number) => void;
  onStartMatch?: (matchId: string) => void;
  onFinishMatch?: (match: Match) => void;
  onCancelMatch?: (match: Match) => void;
  onSwitchPlayers?: (match: Match) => void;
  onEditStagedMatch?: (match: Match) => void;
  onRegenerateMatch?: (match: Match) => void;
  onAssignCourt?: (courtName: string) => void;
}

export const CourtCard: React.FC<CourtCardProps> = ({
  courtName,
  match,
  onScoreChange,
  onStartMatch,
  onFinishMatch,
  onCancelMatch,
  onSwitchPlayers,
  onEditStagedMatch,
  onRegenerateMatch,
  onAssignCourt,
}) => {
  // Live Match Duration Timer (minutes and seconds)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const isLive = match?.status === 'live';
  const isWaiting = match?.status === 'waiting';

  useEffect(() => {
    if (!isLive || !match?.startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const calculateElapsed = () => {
      const raw = match.startedAt;
      if (!raw) return 0;
      // 1. Try ISO date parsing
      const parsedTime = new Date(raw).getTime();
      if (!isNaN(parsedTime) && raw.includes('T')) {
        return Math.max(0, Math.floor((Date.now() - parsedTime) / 1000));
      }
      // 2. Try time string format (e.g., "8:30 AM" or "17:30")
      const now = new Date();
      const parts = raw.trim().split(' ');
      if (parts.length >= 1 && parts[0].includes(':')) {
        const [h, m] = parts[0].split(':').map(Number);
        let hours = h;
        const mod = parts[1];
        if (mod === 'PM' && hours < 12) hours += 12;
        if (mod === 'AM' && hours === 12) hours = 0;
        now.setHours(hours, m || 0, 0, 0);
        const diff = Math.floor((Date.now() - now.getTime()) / 1000);
        return diff > 0 ? diff : 0;
      }
      return 0;
    };

    setElapsedSeconds(calculateElapsed());
    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive, match?.startedAt]);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m ${secs < 10 ? '0' : ''}${secs}s`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Empty available court state
  if (!match) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/40 p-6 sm:p-8 flex flex-col items-center justify-center text-center min-h-[460px] transition-all">
        <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-800 dark:text-neutral-200">
          {courtName.toUpperCase()}
        </h3>
        <p className="mt-2 text-base text-neutral-500 dark:text-neutral-400">
          Court is available
        </p>
        <div className="mt-3">
          <StatusBadge status="available" label="COURT OPEN" size="md" />
        </div>

        {onAssignCourt && (
          <button
            type="button"
            onClick={() => onAssignCourt(courtName)}
            className="mt-6 min-h-[48px] px-6 rounded-xl font-bold text-base bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer active:scale-95 shadow-sm whitespace-nowrap"
          >
            Assign Match
          </button>
        )}
      </div>
    );
  }

  const {
    id,
    team1Player1,
    team1Player2,
    team2Player1,
    team2Player2,
    score1,
    score2,
    switches,
  } = match;

  const lastSwitch = switches && switches.length > 0 ? switches[switches.length - 1] : null;

  return (
    <div className="rounded-2xl border-2 border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow min-h-[460px]">
      {/* 1. COURT NUMBER HEADER & LIVE DURATION TIMER */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-950 dark:text-white truncate">
            {courtName.toUpperCase()}
          </h3>
          {isLive && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-mono font-black text-xs sm:text-sm tracking-wide shadow-xs shrink-0"
              title="Elapsed match duration"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
              <span className="whitespace-nowrap">{formatDuration(elapsedSeconds)}</span>
            </div>
          )}
        </div>

        <div className="shrink-0">
          {isLive && (
            <span className="px-3 py-1 rounded-lg text-xs font-black bg-emerald-600 text-white tracking-widest uppercase flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white" />
              LIVE
            </span>
          )}
          {isWaiting && (
            <span className="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-black bg-amber-500 text-white tracking-widest uppercase whitespace-nowrap">
              NEXT ROUND
            </span>
          )}
        </div>
      </div>

      {/* Lineup Switch Alert Pill (if a switch happened during this live match) */}
      {lastSwitch && (
        <div className="mt-2 py-1 px-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
          <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            Lineup Switched: {lastSwitch.switchedPlayerIds[0]} ↔ {lastSwitch.switchedPlayerIds[1]} ({lastSwitch.timestamp})
          </span>
        </div>
      )}

      {/* 2. MAIN MATCHUP & SCORE LAYOUT */}
      <div className="py-4 flex flex-col items-center justify-center text-center space-y-4">
        {/* TEAM 1 */}
        <div className="w-full">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
            Team 1
          </p>
          <div className="text-xl sm:text-2xl font-black text-neutral-950 dark:text-neutral-50 flex items-center justify-center flex-wrap gap-x-2 gap-y-0.5">
            <span>{team1Player1.name}</span>
            <span className="text-neutral-400 font-normal">+</span>
            <span>{team1Player2.name}</span>
          </div>
          <div className="flex items-center justify-center gap-2 mt-1 text-xs text-neutral-500 font-medium">
            {team1Player1.skillLevel && (
              <span>
                {team1Player1.name.split(' ')[0]}: {SKILL_LEVEL_SHORT_LABELS[team1Player1.skillLevel]}
              </span>
            )}
            {team1Player1.skillLevel && team1Player2.skillLevel && <span>·</span>}
            {team1Player2.skillLevel && (
              <span>
                {team1Player2.name.split(' ')[0]}: {SKILL_LEVEL_SHORT_LABELS[team1Player2.skillLevel]}
              </span>
            )}
          </div>
        </div>

        {/* TEAM 1 SCORE WITH TOUCH CONTROLS */}
        <div className="flex items-center justify-center gap-4">
          {onScoreChange && isLive && (
            <button
              type="button"
              onClick={() => onScoreChange(id, 1, -1)}
              disabled={score1 <= 0}
              aria-label="Decrease Team 1 score"
              className="w-11 h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-black text-xl flex items-center justify-center disabled:opacity-30 cursor-pointer active:scale-95 transition-all"
            >
              <Minus className="w-5 h-5" />
            </button>
          )}

          <div className="min-w-[70px] py-1 px-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700">
            <span className="text-4xl sm:text-5xl font-black tabular-nums tracking-wider text-neutral-950 dark:text-white">
              {score1}
            </span>
          </div>

          {onScoreChange && isLive && (
            <button
              type="button"
              onClick={() => onScoreChange(id, 1, 1)}
              aria-label="Increase Team 1 score"
              className="w-11 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-xs"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* VS DIVIDER */}
        <div className="w-full flex items-center justify-center gap-3 my-1">
          <div className="h-px bg-neutral-200 dark:bg-neutral-800 flex-1" />
          <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 px-2">
            VS
          </span>
          <div className="h-px bg-neutral-200 dark:bg-neutral-800 flex-1" />
        </div>

        {/* TEAM 2 */}
        <div className="w-full">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
            Team 2
          </p>
          <div className="text-xl sm:text-2xl font-black text-neutral-950 dark:text-neutral-50 flex items-center justify-center flex-wrap gap-x-2 gap-y-0.5">
            <span>{team2Player1.name}</span>
            <span className="text-neutral-400 font-normal">+</span>
            <span>{team2Player2.name}</span>
          </div>
          <div className="flex items-center justify-center gap-2 mt-1 text-xs text-neutral-500 font-medium">
            {team2Player1.skillLevel && (
              <span>
                {team2Player1.name.split(' ')[0]}: {SKILL_LEVEL_SHORT_LABELS[team2Player1.skillLevel]}
              </span>
            )}
            {team2Player1.skillLevel && team2Player2.skillLevel && <span>·</span>}
            {team2Player2.skillLevel && (
              <span>
                {team2Player2.name.split(' ')[0]}: {SKILL_LEVEL_SHORT_LABELS[team2Player2.skillLevel]}
              </span>
            )}
          </div>
        </div>

        {/* TEAM 2 SCORE WITH TOUCH CONTROLS */}
        <div className="flex items-center justify-center gap-4">
          {onScoreChange && isLive && (
            <button
              type="button"
              onClick={() => onScoreChange(id, 2, -1)}
              disabled={score2 <= 0}
              aria-label="Decrease Team 2 score"
              className="w-11 h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-black text-xl flex items-center justify-center disabled:opacity-30 cursor-pointer active:scale-95 transition-all"
            >
              <Minus className="w-5 h-5" />
            </button>
          )}

          <div className="min-w-[70px] py-1 px-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700">
            <span className="text-4xl sm:text-5xl font-black tabular-nums tracking-wider text-neutral-950 dark:text-white">
              {score2}
            </span>
          </div>

          {onScoreChange && isLive && (
            <button
              type="button"
              onClick={() => onScoreChange(id, 2, 1)}
              aria-label="Increase Team 2 score"
              className="w-11 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-xs"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Status indicator below scores */}
        <div className="pt-1 flex items-center gap-2">
          <StatusBadge status={isLive ? 'live' : 'waiting'} size="md" />
        </div>
      </div>

      {/* 3. ORGANIZER ACTION BUTTONS - Single Line Guaranteed */}
      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
        {/* WAITING MATCH CONTROLS (BEFORE IT STARTS) */}
        {isWaiting && (
          <>
            {onStartMatch && (
              <button
                type="button"
                onClick={() => onStartMatch(id)}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl text-base font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-95 shadow-sm whitespace-nowrap"
              >
                <Play className="w-5 h-5 fill-current shrink-0" />
                <span className="whitespace-nowrap leading-none">Start Match</span>
              </button>
            )}

            <div className="grid grid-cols-3 gap-2">
              {/* Edit Match (Teams / Court) Before Match Starts */}
              {onEditStagedMatch && (
                <button
                  type="button"
                  onClick={() => onEditStagedMatch(match)}
                  title="Edit teams or change court before starting"
                  className="min-h-[42px] px-2 py-2 rounded-xl text-xs sm:text-sm font-bold border border-neutral-300 dark:border-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95 whitespace-nowrap"
                >
                  <Edit2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Edit</span>
                </button>
              )}

              {/* Regenerate this specific match */}
              {onRegenerateMatch && (
                <button
                  type="button"
                  onClick={() => onRegenerateMatch(match)}
                  title="Regenerate this match with different pairs"
                  className="min-h-[42px] px-2 py-2 rounded-xl text-xs sm:text-sm font-bold border border-neutral-300 dark:border-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95 whitespace-nowrap"
                >
                  <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                  <span>Re-roll</span>
                </button>
              )}

              {/* Cancel Match */}
              {onCancelMatch && (
                <button
                  type="button"
                  onClick={() => onCancelMatch(match)}
                  title="Cancel staged match"
                  className="min-h-[42px] px-2 py-2 rounded-xl text-xs sm:text-sm font-bold border border-neutral-300 dark:border-neutral-700 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-500 hover:text-rose-600 flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95 whitespace-nowrap"
                >
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* LIVE MATCH CONTROLS */}
        {isLive && (
          <>
            {onFinishMatch && (
              <button
                type="button"
                onClick={() => onFinishMatch(match)}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl text-base font-black bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-95 shadow-sm whitespace-nowrap"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-600 shrink-0" />
                <span className="whitespace-nowrap leading-none">Finish Match</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              {/* In a live match, normal editing is NOT allowed; use SWITCH PLAYERS */}
              {onSwitchPlayers && (
                <button
                  type="button"
                  onClick={() => onSwitchPlayers(match)}
                  aria-label="Switch players"
                  className="min-h-[42px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-neutral-300 dark:border-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95 whitespace-nowrap"
                >
                  <ArrowLeftRight className="w-4 h-4 shrink-0" />
                  <span>Switch</span>
                </button>
              )}

              {/* Cancel Match */}
              {onCancelMatch && (
                <button
                  type="button"
                  onClick={() => onCancelMatch(match)}
                  aria-label="Cancel live match"
                  className="min-h-[42px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border border-neutral-300 dark:border-neutral-700 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-500 hover:text-rose-600 flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95 whitespace-nowrap"
                >
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
