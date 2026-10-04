import React from 'react';
import { Player, PlayerStatus, SKILL_LEVEL_SHORT_LABELS, PLAYER_STATUS_LABELS } from '../../types';
import { Activity, Clock, Check, Ban, Edit, Trash2, User } from 'lucide-react';

export interface PlayerRowProps {
  player: Player;
  onToggleStatus?: (player: Player) => void;
  onEdit?: (player: Player) => void;
  onRemove?: (player: Player) => void;
  onSelect?: (player: Player) => void;
  courtName?: string | null;
}

export const PlayerRow: React.FC<PlayerRowProps> = ({
  player,
  onToggleStatus,
  onEdit,
  onRemove,
  onSelect,
  courtName,
}) => {
  const isPlaying = player.status === 'playing' || Boolean(player.currentCourtId);
  const effectiveStatus: PlayerStatus = isPlaying ? 'playing' : player.status;

  // Status visual configurations
  const statusStyles: Record<PlayerStatus, { label: string; badgeBg: string; dot: string }> = {
    available: {
      label: 'Available',
      badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700',
      dot: 'bg-emerald-500',
    },
    playing: {
      label: courtName ? `Playing (${courtName})` : 'Playing',
      badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700',
      dot: 'bg-blue-500 animate-pulse',
    },
    waiting: {
      label: 'Waiting',
      badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700',
      dot: 'bg-amber-500',
    },
    unavailable: {
      label: 'Unavailable',
      badgeBg: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700',
      dot: 'bg-neutral-400',
    },
  };

  const currentStatusStyle = statusStyles[effectiveStatus] || statusStyles.available;

  return (
    <div
      onClick={() => onSelect?.(player)}
      className={`group flex flex-col md:flex-row items-stretch md:items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all ${
        player.status === 'unavailable'
          ? 'bg-neutral-100/70 dark:bg-neutral-950/60 border-neutral-200 dark:border-neutral-800 opacity-70'
          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-xs'
      } gap-3 sm:gap-4`}
    >
      {/* Player Identity with Profile Photo & Two Clean Lines */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative shrink-0">
          {player.photoUrl ? (
            <img
              src={player.photoUrl}
              alt={player.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700 shadow-xs"
              onError={(e) => {
                // Graceful fallback to initials if image link breaks
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-sm sm:text-base shadow-xs ${
                isPlaying
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                  : player.status === 'available'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                  : player.status === 'waiting'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                  : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
              }`}
            >
              {player.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}

          {/* Quick status dot on avatar */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white dark:ring-neutral-900 ${currentStatusStyle.dot}`}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          {/* Line 1: Player Name + Skill Level + Status Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-base sm:text-lg font-black text-neutral-950 dark:text-neutral-50 truncate leading-none">
                {player.name}
              </span>

              {/* Concise Skill Badge */}
              {player.skillLevel ? (
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 whitespace-nowrap shrink-0 leading-none">
                  Lvl {player.skillLevel}
                  <span className="hidden sm:inline"> · {SKILL_LEVEL_SHORT_LABELS[player.skillLevel]}</span>
                </span>
              ) : null}
            </div>

            {/* Status Badge */}
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-md flex items-center gap-1.5 whitespace-nowrap shrink-0 leading-tight ${currentStatusStyle.badgeBg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${currentStatusStyle.dot}`} />
              <span>{currentStatusStyle.label}</span>
            </span>
          </div>

          {/* Line 2: Concise Player Stats & Rotation Context */}
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate whitespace-nowrap">
            <span>
              {player.gamesPlayed} {player.gamesPlayed === 1 ? 'game' : 'games'} ({player.gamesWon}W–{player.gamesLost}L)
            </span>
            <span className="mx-1.5 text-neutral-300 dark:text-neutral-700">·</span>
            {isPlaying ? (
              <span className="text-blue-700 dark:text-blue-400 font-bold">
                Live on {courtName || 'Court'}
              </span>
            ) : player.status === 'waiting' ? (
              <span className="text-amber-700 dark:text-amber-400 font-bold">
                Next up ({player.sittingRounds} {player.sittingRounds === 1 ? 'round' : 'rounds'} off)
              </span>
            ) : player.status === 'available' ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                Checked in · Ready
              </span>
            ) : (
              <span className="text-neutral-400">
                Marked out
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Organizer Action Buttons: Touch Friendly (min 44px) */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800">
        {/* Quick Check-in / Availability Toggle */}
        {onToggleStatus && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(player);
            }}
            className={`min-h-[44px] flex-1 md:flex-initial px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              player.status === 'unavailable'
                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {player.status === 'unavailable' ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Check In</span>
              </>
            ) : (
              <>
                <Ban className="w-4 h-4 text-neutral-500" />
                <span>Mark Out</span>
              </>
            )}
          </button>
        )}

        {/* Edit Button */}
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(player);
            }}
            aria-label={`Edit ${player.name}`}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}

        {/* Remove Button */}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(player);
            }}
            aria-label={`Remove ${player.name}`}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-neutral-500 hover:text-rose-600 transition-colors cursor-pointer flex items-center justify-center shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
