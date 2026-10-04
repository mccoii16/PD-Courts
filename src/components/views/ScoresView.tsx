import React, { useState, useMemo } from 'react';
import { Match, Player, Court, PickleballEvent, SKILL_LEVEL_SHORT_LABELS } from '../../types';
import {
  Trophy,
  Calendar,
  Clock,
  Layers,
  Users,
  Search,
  ArrowLeftRight,
  Medal,
  CheckCircle2,
  TrendingUp,
  Activity,
} from 'lucide-react';

export interface ScoresViewProps {
  completedMatches: Match[];
  players: Player[];
  courts: Court[];
  currentEvent: PickleballEvent;
}

export const ScoresView: React.FC<ScoresViewProps> = ({
  completedMatches,
  players,
  courts,
  currentEvent,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'standings'>('history');
  const [searchTerm, setSearchTerm] = useState('');
  const [courtFilter, setCourtFilter] = useState('all');

  // 1. Calculate Event Summary Statistics
  const eventSummary = useMemo(() => {
    const totalPlayers = players.length;
    const activePlayers = players.filter((p) => p.status !== 'unavailable').length;
    const totalCourts = courts.length;
    const totalMatches = completedMatches.length;

    // Calculate approximate duration
    // If we have completed matches, duration is from earliest startedAt to latest completedAt
    let durationText = '1h 30m';
    if (completedMatches.length > 0) {
      const totalMins = completedMatches.reduce(
        (acc, m) => acc + (m.durationMinutes || 18),
        0
      );
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    } else if (currentEvent.startTime) {
      durationText = 'In Progress';
    }

    return {
      totalPlayers,
      activePlayers,
      totalCourts,
      totalMatches,
      durationText,
    };
  }, [players, courts, completedMatches, currentEvent]);

  // 2. Calculate Player Standings & Statistics
  const playerStats = useMemo(() => {
    return players.map((player) => {
      let pointsScored = 0;
      let pointsConceded = 0;

      for (const match of completedMatches) {
        const inTeam1 =
          match.team1Player1.id === player.id || match.team1Player2.id === player.id;
        const inTeam2 =
          match.team2Player1.id === player.id || match.team2Player2.id === player.id;

        if (inTeam1) {
          pointsScored += match.score1;
          pointsConceded += match.score2;
        } else if (inTeam2) {
          pointsScored += match.score2;
          pointsConceded += match.score1;
        }
      }

      const gp = player.gamesPlayed;
      const wins = player.gamesWon;
      const losses = player.gamesLost;
      const winPct = gp > 0 ? Math.round((wins / gp) * 100) : 0;
      const pointDiff = pointsScored - pointsConceded;

      return {
        ...player,
        gamesPlayed: gp,
        gamesWon: wins,
        gamesLost: losses,
        winPercentage: winPct,
        pointsScored,
        pointsConceded,
        pointDifferential: pointDiff,
      };
    });
  }, [players, completedMatches]);

  // Sort standings by Win Percentage desc, then Total Wins desc, then Point Differential desc
  const sortedStandings = useMemo(() => {
    return [...playerStats]
      .filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
      .sort((a, b) => {
        if (b.winPercentage !== a.winPercentage) {
          return b.winPercentage - a.winPercentage;
        }
        if (b.gamesWon !== a.gamesWon) {
          return b.gamesWon - a.gamesWon;
        }
        return b.pointDifferential - a.pointDifferential;
      });
  }, [playerStats, searchTerm]);

  // Filter completed matches
  const filteredMatches = useMemo(() => {
    return completedMatches.filter((match) => {
      const matchCourt = courtFilter === 'all' || match.courtId === courtFilter;
      const playerSearch =
        searchTerm === '' ||
        match.team1Player1.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.team1Player2.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.team2Player1.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.team2Player2.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCourt && playerSearch;
    });
  }, [completedMatches, courtFilter, searchTerm]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Header with Event Name */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 sm:p-7 rounded-2xl shadow-sm">
        <div className="space-y-2.5">
          {/* Active Event Pill Tag */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black bg-emerald-600 text-white uppercase tracking-wider shadow-xs whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{currentEvent.name}</span>
            </span>
            <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500">
              {currentEvent.date}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-neutral-950 dark:text-white leading-tight">
            Match History & Event Statistics
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-medium">
            Official scores, lineup switch audit, and player event standings
          </p>
        </div>

        {/* 2. EVENT SUMMARY TILES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mt-5 pt-5 border-t border-neutral-200 dark:border-neutral-800">
          {/* Players */}
          <div className="p-3 sm:p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
            <span className="text-[11px] sm:text-xs uppercase font-bold text-neutral-500 flex items-center gap-1.5 mb-1 truncate">
              <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Players
            </span>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-950 dark:text-white tabular-nums">
              {eventSummary.totalPlayers}
            </p>
            <span className="text-[11px] sm:text-xs text-neutral-500 font-medium truncate block">
              {eventSummary.activePlayers} active in session
            </span>
          </div>

          {/* Courts */}
          <div className="p-3 sm:p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
            <span className="text-[11px] sm:text-xs uppercase font-bold text-neutral-500 flex items-center gap-1.5 mb-1 truncate">
              <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Courts
            </span>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-950 dark:text-white tabular-nums">
              {eventSummary.totalCourts}
            </p>
            <span className="text-[11px] sm:text-xs text-neutral-500 font-medium truncate block">
              {eventSummary.totalCourts * 4} on-court capacity
            </span>
          </div>

          {/* Matches Played */}
          <div className="p-3 sm:p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
            <span className="text-[11px] sm:text-xs uppercase font-bold text-neutral-500 flex items-center gap-1.5 mb-1 truncate">
              <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Matches
            </span>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-950 dark:text-white tabular-nums">
              {eventSummary.totalMatches}
            </p>
            <span className="text-[11px] sm:text-xs text-neutral-500 font-medium truncate block">
              Completed official games
            </span>
          </div>

          {/* Event Duration */}
          <div className="p-3 sm:p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
            <span className="text-[11px] sm:text-xs uppercase font-bold text-neutral-500 flex items-center gap-1.5 mb-1 truncate">
              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Duration
            </span>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-950 dark:text-white tabular-nums truncate">
              {eventSummary.durationText}
            </p>
            <span className="text-[11px] sm:text-xs text-neutral-500 font-medium truncate block">
              Started {currentEvent.startTime || 'earlier today'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs: MATCH HISTORY vs PLAYER STANDINGS */}
      <div className="grid grid-cols-2 gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 sm:flex sm:items-center">
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`min-h-[44px] px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>Match History ({completedMatches.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('standings')}
          className={`min-h-[44px] px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeTab === 'standings'
              ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Trophy className="w-4 h-4 shrink-0" />
          <span>Player Standings</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'history'
                ? 'Search matches by player name...'
                : 'Search players in standings...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {activeTab === 'history' && courts.length > 1 && (
          <div className="shrink-0">
            <select
              value={courtFilter}
              onChange={(e) => setCourtFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Courts</option>
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4. TAB CONTENT: MATCH HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {filteredMatches.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 text-center bg-white/40 dark:bg-neutral-900/40">
              <Trophy className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                No matches found
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                Completed games will appear here with final scores, winners, and lineup switch records.
              </p>
            </div>
          ) : (
            filteredMatches.map((match, idx) => {
              const matchNum = match.matchNumber || completedMatches.length - idx;
              const roundNum = match.roundNumber || Math.ceil(matchNum / Math.max(1, courts.length));
              const team1Won = match.score1 > match.score2;
              const team2Won = match.score2 > match.score1;
              const hasSwitch = Boolean(match.switches && match.switches.length > 0);

              return (
                <div
                  key={match.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors space-y-4"
                >
                  {/* Top Bar: Match Number, Round, Court, Time */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black px-2.5 py-1 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                        MATCH #{matchNum}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        Round {roundNum}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 uppercase">
                        {match.courtName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {match.startedAt
                          ? `${
                              match.startedAt.includes('T')
                                ? new Date(match.startedAt).toLocaleTimeString([], {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })
                                : match.startedAt
                            } – `
                          : ''}
                        {match.completedAt || 'Finished'}
                      </span>
                      {match.durationMinutes ? (
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 font-bold">
                          {match.durationMinutes} min
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Player Switch Notice (Requested in Phase 6) */}
                  {hasSwitch && match.switches && (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 text-xs sm:text-sm font-semibold space-y-1">
                      <div className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-300">
                        <ArrowLeftRight className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>Player Switch Occurred Mid-Match</span>
                        <span className="font-normal text-xs text-neutral-500">
                          ({match.switches[0].timestamp})
                        </span>
                      </div>
                      <p className="text-neutral-700 dark:text-neutral-300">
                        Switched: <strong>{match.switches[0].switchedPlayerIds[0]}</strong> ↔{' '}
                        <strong>{match.switches[0].switchedPlayerIds[1]}</strong>
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        Original: {match.switches[0].originalTeam1.join(' + ')} vs{' '}
                        {match.switches[0].originalTeam2.join(' + ')}
                      </p>
                    </div>
                  )}

                  {/* Main Scoreboard Layout: Team 1 vs Team 2 with Winner Highlight */}
                  <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4 text-center md:text-left">
                    {/* Team 1 */}
                    <div
                      className={`md:col-span-2 p-3 rounded-xl border ${
                        team1Won
                          ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        {team1Won && <Trophy className="w-5 h-5 text-amber-500 shrink-0" />}
                        <p
                          className={`text-lg sm:text-xl font-bold ${
                            team1Won
                              ? 'text-neutral-950 dark:text-white font-black'
                              : 'text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {match.team1Player1.name} & {match.team1Player2.name}
                        </p>
                      </div>
                      <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                        <span className="text-xs text-neutral-400 font-bold uppercase">Team 1</span>
                        {team1Won && (
                          <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                            Winner
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Final Score */}
                    <div className="md:col-span-1 flex flex-col items-center justify-center">
                      <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700">
                        <span
                          className={`text-3xl font-black tabular-nums ${
                            team1Won
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {match.score1}
                        </span>
                        <span className="text-xl font-light text-neutral-400">-</span>
                        <span
                          className={`text-3xl font-black tabular-nums ${
                            team2Won
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {match.score2}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mt-1">
                        Final Score
                      </span>
                    </div>

                    {/* Team 2 */}
                    <div
                      className={`md:col-span-2 p-3 rounded-xl border md:text-right ${
                        team2Won
                          ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-center md:justify-end gap-2">
                        <p
                          className={`text-lg sm:text-xl font-bold ${
                            team2Won
                              ? 'text-neutral-950 dark:text-white font-black'
                              : 'text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {match.team2Player1.name} & {match.team2Player2.name}
                        </p>
                        {team2Won && <Trophy className="w-5 h-5 text-amber-500 shrink-0" />}
                      </div>
                      <div className="flex items-center justify-center md:justify-end gap-2 mt-1">
                        {team2Won && (
                          <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                            Winner
                          </span>
                        )}
                        <span className="text-xs text-neutral-400 font-bold uppercase">Team 2</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5. TAB CONTENT: PLAYER STANDINGS & STATISTICS */}
      {activeTab === 'standings' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-neutral-950 dark:text-white">
                Player Standings
              </h2>
              <p className="text-sm text-neutral-500">
                Simple open-play statistics based on games played and win percentage
              </p>
            </div>
            <span className="text-xs font-bold text-neutral-400 uppercase">
              Ranked by Win %
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6 w-16">Rank</th>
                  <th className="py-3.5 px-4 sm:px-6">Player</th>
                  <th className="py-3.5 px-3 text-center">GP</th>
                  <th className="py-3.5 px-3 text-center">W</th>
                  <th className="py-3.5 px-3 text-center">L</th>
                  <th className="py-3.5 px-4 text-center">Win %</th>
                  <th className="py-3.5 px-3 text-center hidden md:table-cell">PF</th>
                  <th className="py-3.5 px-3 text-center hidden md:table-cell">PA</th>
                  <th className="py-3.5 px-4 text-center hidden md:table-cell">+/-</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {sortedStandings.map((player, idx) => {
                  const isTop3 = idx < 3 && player.gamesPlayed > 0;

                  return (
                    <tr
                      key={player.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      {/* Rank */}
                      <td className="py-4 px-4 sm:px-6 font-black text-base tabular-nums">
                        {isTop3 ? (
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                              idx === 0
                                ? 'bg-amber-400 text-amber-950 shadow-xs'
                                : idx === 1
                                ? 'bg-neutral-300 text-neutral-900'
                                : 'bg-amber-700/30 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {idx + 1}
                          </div>
                        ) : (
                          <span className="text-neutral-500">#{idx + 1}</span>
                        )}
                      </td>

                      {/* Player Name & Skill */}
                      <td className="py-4 px-4 sm:px-6 min-w-[180px]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center shrink-0">
                            {player.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-base text-neutral-950 dark:text-white block">
                              {player.name}
                            </span>
                            <span className="text-xs text-neutral-500 font-medium">
                              {player.skillLevel
                                ? `Lvl ${player.skillLevel} · ${SKILL_LEVEL_SHORT_LABELS[player.skillLevel]}`
                                : 'Unrated'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* GP */}
                      <td className="py-4 px-3 text-center font-bold text-base tabular-nums">
                        {player.gamesPlayed}
                      </td>

                      {/* Wins */}
                      <td className="py-4 px-3 text-center font-bold text-base tabular-nums text-emerald-700 dark:text-emerald-400">
                        {player.gamesWon}
                      </td>

                      {/* Losses */}
                      <td className="py-4 px-3 text-center font-bold text-base tabular-nums text-neutral-500">
                        {player.gamesLost}
                      </td>

                      {/* Win % */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-sm font-black tabular-nums ${
                            player.winPercentage >= 65
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : player.winPercentage >= 40
                              ? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
                              : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                          }`}
                        >
                          {player.winPercentage}%
                        </span>
                      </td>

                      {/* Points For (PF) */}
                      <td className="py-4 px-3 text-center font-semibold text-sm tabular-nums hidden md:table-cell">
                        {player.pointsScored}
                      </td>

                      {/* Points Against (PA) */}
                      <td className="py-4 px-3 text-center font-semibold text-sm tabular-nums text-neutral-500 hidden md:table-cell">
                        {player.pointsConceded}
                      </td>

                      {/* +/- Differential */}
                      <td className="py-4 px-4 text-center font-black text-sm tabular-nums hidden md:table-cell">
                        <span
                          className={
                            player.pointDifferential > 0
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : player.pointDifferential < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-neutral-400'
                          }
                        >
                          {player.pointDifferential > 0
                            ? `+${player.pointDifferential}`
                            : player.pointDifferential}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
