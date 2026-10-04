import React, { useState } from 'react';
import { Court, Match, Player, SkillLevel, SKILL_LEVEL_LABELS, SKILL_LEVEL_SHORT_LABELS } from '../../types';
import { CourtCard } from '../ui/CourtCard';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import {
  Play,
  Shuffle,
  Users,
  ArrowLeftRight,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Trophy,
  CheckCircle2,
  XCircle,
  PlayCircle,
  UserPlus,
  Edit2,
  RefreshCw,
  AlertTriangle,
  Sliders,
} from 'lucide-react';

export interface LiveMatchesViewProps {
  courts: Court[];
  matches: Match[];
  completedMatches: Match[];
  players: Player[];
  onScoreChange: (matchId: string, team: 1 | 2, delta: number) => void;
  onStartMatch: (matchId: string) => void;
  onStartAllMatches: () => void;
  onFinishMatch: (match: Match) => void;
  onCancelMatch: (match: Match) => void;
  onApplyPlayerSwitch: (matchId: string, player1Id: string, player2Id: string) => void;
  onGenerateNextRound: () => void;
  onShuffleMatches: () => void;
  onEditStagedMatch: (updatedMatch: Match) => void;
  onRegenerateSingleMatch: (match: Match) => void;
  onAddLatePlayer: (name: string, skillLevel?: SkillLevel) => void;
  onUpdateCourtsCount: (count: number) => void;
  matchmakerFeedback?: string | null;
}

export type LiveSectionTab = 'all' | 'live' | 'next' | 'waiting' | 'finished';

export const LiveMatchesView: React.FC<LiveMatchesViewProps> = ({
  courts,
  matches,
  completedMatches,
  players,
  onScoreChange,
  onStartMatch,
  onStartAllMatches,
  onFinishMatch,
  onCancelMatch,
  onApplyPlayerSwitch,
  onGenerateNextRound,
  onShuffleMatches,
  onEditStagedMatch,
  onRegenerateSingleMatch,
  onAddLatePlayer,
  onUpdateCourtsCount,
  matchmakerFeedback,
}) => {
  const [activeSection, setActiveSection] = useState<LiveSectionTab>('all');
  const [selectedCourtsCount, setSelectedCourtsCount] = useState<number>(courts.length || 3);
  const [isChangeCourtsOpen, setIsChangeCourtsOpen] = useState(false);

  // Dialog states
  const [selectedMatchForSwitch, setSelectedMatchForSwitch] = useState<Match | null>(null);
  const [selectedTeam1PlayerId, setSelectedTeam1PlayerId] = useState<string>('');
  const [selectedTeam2PlayerId, setSelectedTeam2PlayerId] = useState<string>('');
  const [switchSuccessMessage, setSwitchSuccessMessage] = useState<string | null>(null);

  const [confirmFinishMatch, setConfirmFinishMatch] = useState<Match | null>(null);
  const [confirmCancelMatch, setConfirmCancelMatch] = useState<Match | null>(null);

  // Edit Staged Match Dialog state
  const [editingStagedMatch, setEditingStagedMatch] = useState<Match | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editCourtId, setEditCourtId] = useState<string>('');
  const [editT1P1Id, setEditT1P1Id] = useState<string>('');
  const [editT1P2Id, setEditT1P2Id] = useState<string>('');
  const [editT2P1Id, setEditT2P1Id] = useState<string>('');
  const [editT2P2Id, setEditT2P2Id] = useState<string>('');

  // Add Late Player Dialog state
  const [isAddLateOpen, setIsAddLateOpen] = useState(false);
  const [latePlayerName, setLatePlayerName] = useState('');
  const [latePlayerSkill, setLatePlayerSkill] = useState<SkillLevel | ''>('');

  // Group matches
  const liveMatches = matches.filter((m) => m.status === 'live');
  const nextMatches = matches.filter((m) => m.status === 'waiting');
  const activeCourts = courts.filter((c) => c.isActive);

  // Waiting players: Checked in, not currently assigned to any court
  const waitingPlayers = players.filter(
    (p) => (p.status === 'waiting' || p.status === 'available') && !p.currentCourtId
  );

  const availablePlayers = players.filter((p) => p.status !== 'unavailable');

  // Open Edit Staged Match Dialog
  const handleOpenEditStagedMatch = (match: Match) => {
    setEditingStagedMatch(match);
    setEditError(null);
    setEditCourtId(match.courtId);
    setEditT1P1Id(match.team1Player1.id);
    setEditT1P2Id(match.team1Player2.id);
    setEditT2P1Id(match.team2Player1.id);
    setEditT2P2Id(match.team2Player2.id);
  };

  const handleSaveStagedMatchEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStagedMatch) return;

    // Validate unique players
    const selectedIds = [editT1P1Id, editT1P2Id, editT2P1Id, editT2P2Id];
    const uniqueIds = new Set(selectedIds);
    if (uniqueIds.size < 4) {
      setEditError('Please select 4 distinct players for the 2v2 match.');
      return;
    }
    setEditError(null);

    const p1 = players.find((p) => p.id === editT1P1Id);
    const p2 = players.find((p) => p.id === editT1P2Id);
    const p3 = players.find((p) => p.id === editT2P1Id);
    const p4 = players.find((p) => p.id === editT2P2Id);
    const targetCourt = courts.find((c) => c.id === editCourtId);

    if (!p1 || !p2 || !p3 || !p4 || !targetCourt) return;

    onEditStagedMatch({
      ...editingStagedMatch,
      courtId: targetCourt.id,
      courtName: targetCourt.name.toUpperCase(),
      team1Player1: p1,
      team1Player2: p2,
      team2Player1: p3,
      team2Player2: p4,
    });

    setEditingStagedMatch(null);
  };

  // Handle Add Late Player Submit
  const handleAddLateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!latePlayerName.trim()) return;

    onAddLatePlayer(
      latePlayerName.trim(),
      latePlayerSkill ? (Number(latePlayerSkill) as SkillLevel) : undefined
    );

    setLatePlayerName('');
    setLatePlayerSkill('');
    setIsAddLateOpen(false);
  };

  // Open Switch Players Dialog
  const handleOpenSwitchDialog = (match: Match) => {
    setSelectedMatchForSwitch(match);
    setSelectedTeam1PlayerId(match.team1Player1.id);
    setSelectedTeam2PlayerId(match.team2Player1.id);
    setSwitchSuccessMessage(null);
  };

  const handleConfirmSwitch = () => {
    if (!selectedMatchForSwitch || !selectedTeam1PlayerId || !selectedTeam2PlayerId) return;

    onApplyPlayerSwitch(selectedMatchForSwitch.id, selectedTeam1PlayerId, selectedTeam2PlayerId);
    setSwitchSuccessMessage('Player switch applied! Current match score preserved.');

    setTimeout(() => {
      setSelectedMatchForSwitch(null);
      setSwitchSuccessMessage(null);
    }, 1500);
  };

  // Switch preview calculation
  const getSwitchPreview = () => {
    if (!selectedMatchForSwitch) return null;

    const t1p1 = selectedMatchForSwitch.team1Player1;
    const t1p2 = selectedMatchForSwitch.team1Player2;
    const t2p1 = selectedMatchForSwitch.team2Player1;
    const t2p2 = selectedMatchForSwitch.team2Player2;

    const switchingFromT1 = selectedTeam1PlayerId === t1p1.id ? t1p1 : t1p2;
    const stayingOnT1 = selectedTeam1PlayerId === t1p1.id ? t1p2 : t1p1;

    const switchingFromT2 = selectedTeam2PlayerId === t2p1.id ? t2p1 : t2p2;
    const stayingOnT2 = selectedTeam2PlayerId === t2p1.id ? t2p2 : t2p1;

    return {
      switchingFromT1,
      stayingOnT1,
      switchingFromT2,
      stayingOnT2,
      newTeam1: [stayingOnT1.name, switchingFromT2.name],
      newTeam2: [stayingOnT2.name, switchingFromT1.name],
      score1: selectedMatchForSwitch.score1,
      score2: selectedMatchForSwitch.score2,
    };
  };

  const switchPreview = getSwitchPreview();

  // Candidates for editing staged matches: All active players
  const availableMatchCandidates = players.filter((p) => p.status !== 'unavailable');

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Header with Matchmaking Controls & Add Late Player */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-950 dark:text-white leading-tight">
              Live & Next Matches
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-black bg-emerald-600 text-white uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {liveMatches.length} Live
            </span>
            {nextMatches.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-black bg-amber-500 text-white uppercase tracking-wider">
                {nextMatches.length} Staged
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium">
            Real-time court management, point tracking, and adaptive player rotation
          </p>

          <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold">
              {availablePlayers.length} Active Players
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <button
              type="button"
              onClick={() => {
                setSelectedCourtsCount(courts.length || 3);
                setIsChangeCourtsOpen(true);
              }}
              className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Click to change number of courts"
            >
              <span>{activeCourts.length} Courts</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-black underline">(Change)</span>
            </button>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-black">
              {waitingPlayers.length} Waiting in Queue
            </span>
          </div>
        </div>

        {/* Action Buttons: Add Player & Shuffle side-by-side on mobile, compact Generate Next Round */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 shrink-0 w-full lg:w-auto">
          {/* Add Player and Shuffle side by side on mobile */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
            <Button
              variant="outline"
              size="sm"
              icon={<UserPlus className="w-4 h-4 text-emerald-600" />}
              onClick={() => setIsAddLateOpen(true)}
              className="min-h-[42px] px-3 py-2 text-xs sm:text-sm font-bold justify-center"
            >
              Add Player
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={<Shuffle className="w-4 h-4 text-neutral-700 dark:text-neutral-200" />}
              onClick={onShuffleMatches}
              disabled={availablePlayers.length < 4 || activeCourts.length === 0}
              className="min-h-[42px] px-3 py-2 text-xs sm:text-sm font-bold justify-center"
            >
              Shuffle
            </Button>
          </div>

          {/* Compact Generate Next Round button */}
          <Button
            variant="primary"
            size="md"
            icon={<Play className="w-4 h-4 fill-current shrink-0" />}
            onClick={onGenerateNextRound}
            disabled={availablePlayers.length < 4 || activeCourts.length === 0}
            className="w-full sm:w-auto min-h-[42px] px-4 py-2 text-xs sm:text-sm font-black whitespace-nowrap justify-center shadow-xs"
          >
            GENERATE NEXT ROUND
          </Button>
        </div>
      </div>

      {/* Manual Start Staged Matches Banner */}
      {nextMatches.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base sm:text-lg font-black">
                {nextMatches.length} Next Round Match{nextMatches.length === 1 ? '' : 'es'} Staged
              </h3>
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 mt-0.5">
                Matches are staged and ready. You can <strong>Edit</strong> teams or <strong>Change Court</strong> before starting, then tap <strong>Start Match</strong> when players are ready.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={<PlayCircle className="w-5 h-5" />}
            onClick={onStartAllMatches}
            className="shrink-0 self-start sm:self-center"
          >
            Start All Matches ({nextMatches.length})
          </Button>
        </div>
      )}

      {/* Feedback Banner */}
      {matchmakerFeedback && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 flex items-center gap-3 animate-in fade-in">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-bold text-sm sm:text-base">{matchmakerFeedback}</p>
        </div>
      )}

      {/* Empty Roster Initial State Banner */}
      {players.length === 0 && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-dashed border-emerald-300 dark:border-emerald-800 text-center space-y-3 shadow-xs animate-in fade-in">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-950 dark:text-white">
            Ready to Begin Open Play
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto">
            You currently have no players on the roster. Add players to start generating fair 2v2 doubles matches across your courts.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              icon={<UserPlus className="w-5 h-5" />}
              onClick={() => setIsAddLateOpen(true)}
            >
              Add First Player
            </Button>
          </div>
        </div>
      )}

      {/* 2. Direct Section Switcher: ALL, LIVE, NEXT, WAITING, FINISHED */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-neutral-200/70 dark:bg-neutral-900 p-1.5 rounded-2xl border border-neutral-300 dark:border-neutral-800 text-sm font-black">
        <button
          type="button"
          onClick={() => setActiveSection('all')}
          className={`py-3 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSection === 'all'
              ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>ALL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('live')}
          className={`py-3 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSection === 'live'
              ? 'bg-white dark:bg-neutral-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black">
            {liveMatches.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('next')}
          className={`py-3 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSection === 'next'
              ? 'bg-white dark:bg-neutral-800 text-amber-700 dark:text-amber-400 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>NEXT</span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black">
            {nextMatches.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('waiting')}
          className={`py-3 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSection === 'waiting'
              ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>WAITING</span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-black">
            {waitingPlayers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('finished')}
          className={`col-span-2 sm:col-span-1 py-3 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSection === 'finished'
              ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>FINISHED</span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-black">
            {completedMatches.length}
          </span>
        </button>
      </div>

      {/* 3. COURTS SCOREBOARD (LIVE / NEXT) OR INITIAL COURT SETUP PROMPT */}
      {(activeSection === 'all' || activeSection === 'live' || activeSection === 'next') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-base sm:text-xl font-black text-neutral-950 dark:text-white flex items-center gap-2 whitespace-nowrap shrink-0 leading-none">
              <Layers className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="whitespace-nowrap">
                {courts.length === 0
                  ? 'Courts Configuration'
                  : activeSection === 'next'
                  ? 'Next Round Matches'
                  : 'Courts Scoreboard'}
              </span>
            </h2>
            {courts.length > 0 && (
              <span className="text-[11px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                {liveMatches.length} live · {nextMatches.length} next up · {courts.length} courts
              </span>
            )}
          </div>

          {courts.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 border-2 border-emerald-500/40 dark:border-emerald-600/40 rounded-3xl p-6 sm:p-10 shadow-sm text-center max-w-2xl mx-auto space-y-6 animate-in fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Layers className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white tracking-tight">
                  How many courts will the event be using?
                </h3>
                <p className="mt-2 text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                  Select how many courts are available for this session. Matches and rotations will scale to your selected court capacity.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 max-w-lg mx-auto">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSelectedCourtsCount(num)}
                    className={`py-3 px-2 rounded-xl text-base font-black transition-all cursor-pointer ${
                      selectedCourtsCount === num
                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500'
                        : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    {num} {num === 1 ? 'Court' : 'Courts'}
                  </button>
                ))}
              </div>

              {/* Custom Stepper */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <span className="text-sm font-bold text-neutral-600 dark:text-neutral-400">Or custom count:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={selectedCourtsCount <= 1}
                    onClick={() => setSelectedCourtsCount(Math.max(1, selectedCourtsCount - 1))}
                    className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-bold text-xl flex items-center justify-center disabled:opacity-40 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-2xl font-black min-w-[36px] text-center">{selectedCourtsCount}</span>
                  <button
                    type="button"
                    disabled={selectedCourtsCount >= 24}
                    onClick={() => setSelectedCourtsCount(Math.min(24, selectedCourtsCount + 1))}
                    className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-bold text-xl flex items-center justify-center disabled:opacity-40 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action button */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="xl"
                  icon={<Check className="w-5 h-5" />}
                  onClick={() => onUpdateCourtsCount(selectedCourtsCount)}
                  className="w-full sm:w-auto px-8"
                >
                  Set {selectedCourtsCount} {selectedCourtsCount === 1 ? 'Court' : 'Courts'} & Open Session
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={
                courts.length === 1
                  ? 'grid grid-cols-1 max-w-xl mx-auto w-full gap-5 sm:gap-6'
                  : courts.length === 2
                  ? 'grid grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto w-full gap-5 sm:gap-6'
                  : courts.length === 4
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 max-w-6xl mx-auto w-full gap-5 sm:gap-6'
                  : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full gap-5 sm:gap-6'
              }
            >
              {courts.map((court) => {
                const match = matches.find(
                  (m) =>
                    m.courtId === court.id &&
                    (activeSection === 'next'
                      ? m.status === 'waiting'
                      : activeSection === 'live'
                      ? m.status === 'live'
                      : m.status === 'live' || m.status === 'waiting')
                );

                return (
                  <CourtCard
                    key={court.id}
                    courtName={court.name}
                    match={match}
                    onScoreChange={onScoreChange}
                    onStartMatch={onStartMatch}
                    onFinishMatch={(m) => setConfirmFinishMatch(m)}
                    onCancelMatch={(m) => setConfirmCancelMatch(m)}
                    onSwitchPlayers={handleOpenSwitchDialog}
                    onEditStagedMatch={handleOpenEditStagedMatch}
                    onRegenerateMatch={onRegenerateSingleMatch}
                    onAssignCourt={() => onGenerateNextRound()}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. WAITING PLAYERS SECTION */}
      {(activeSection === 'all' || activeSection === 'waiting') && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-neutral-950 dark:text-white">
                  Waiting Players ({waitingPlayers.length})
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 font-medium">
                  Prioritized by wait time and fewest games played. Next round includes late arrivals automatically.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<UserPlus className="w-4 h-4 text-emerald-600" />}
              onClick={() => setIsAddLateOpen(true)}
            >
              Add Player
            </Button>
          </div>

          {waitingPlayers.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-dashed border-neutral-200 dark:border-neutral-700">
              <p className="text-base font-bold text-neutral-700 dark:text-neutral-300">
                No players currently waiting
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                All checked-in players are assigned to courts or inactive.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {waitingPlayers.map((player, idx) => (
                <div
                  key={player.id}
                  className="p-3 sm:p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 flex items-center justify-between gap-2.5 min-w-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center font-black text-xs text-neutral-700 dark:text-neutral-300 shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-sm sm:text-base text-neutral-950 dark:text-white truncate leading-tight">
                        {player.name}
                      </p>
                      <p className="text-xs text-neutral-500 font-medium truncate mt-0.5 whitespace-nowrap">
                        <span>
                          {player.gamesPlayed} {player.gamesPlayed === 1 ? 'game' : 'games'} ({player.gamesWon}W–{player.gamesLost}L)
                        </span>
                        {player.skillLevel ? <span> · Lvl {player.skillLevel}</span> : null}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0 whitespace-nowrap">
                    {player.sittingRounds} {player.sittingRounds === 1 ? 'round' : 'rounds'} off
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. FINISHED MATCHES SECTION */}
      {(activeSection === 'all' || activeSection === 'finished') && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-neutral-950 dark:text-white">
                  Finished Matches ({completedMatches.length})
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 font-medium">
                  Completed game scores and winners from this session
                </p>
              </div>
            </div>
          </div>

          {completedMatches.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-dashed border-neutral-200 dark:border-neutral-700">
              <p className="text-base font-bold text-neutral-700 dark:text-neutral-300">
                No finished matches recorded yet
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Completed games will appear here with final scores and winner records.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedMatches.slice(0, 5).map((match) => {
                const team1Won = match.score1 > match.score2;
                const team2Won = match.score2 > match.score1;

                return (
                  <div
                    key={match.id}
                    className="p-3.5 sm:p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 space-y-2.5 transition-all"
                  >
                    {/* Header: Court & Time & Duration */}
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      <span className="text-neutral-700 dark:text-neutral-300 font-black">
                        {match.courtName}
                      </span>
                      <span className="normal-case font-medium">
                        {match.completedAt ? `Finished ${match.completedAt}` : 'Finished'}
                        {match.durationMinutes ? ` · ${match.durationMinutes}m played` : ''}
                      </span>
                    </div>

                    {/* Clean 2-Row Scoreboard */}
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-2 sm:p-3 divide-y divide-neutral-100 dark:divide-neutral-800">
                      {/* Team 1 */}
                      <div className="flex items-center justify-between gap-3 py-1.5 px-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`text-sm sm:text-base font-bold truncate ${
                              team1Won
                                ? 'text-emerald-700 dark:text-emerald-400 font-black'
                                : 'text-neutral-800 dark:text-neutral-200'
                            }`}
                          >
                            {match.team1Player1.name} & {match.team1Player2.name}
                          </span>
                          {team1Won && (
                            <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                              Win
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-lg sm:text-xl font-black tabular-nums min-w-[28px] text-right ${
                            team1Won
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}
                        >
                          {match.score1}
                        </span>
                      </div>

                      {/* Team 2 */}
                      <div className="flex items-center justify-between gap-3 py-1.5 px-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`text-sm sm:text-base font-bold truncate ${
                              team2Won
                                ? 'text-emerald-700 dark:text-emerald-400 font-black'
                                : 'text-neutral-800 dark:text-neutral-200'
                            }`}
                          >
                            {match.team2Player1.name} & {match.team2Player2.name}
                          </span>
                          {team2Won && (
                            <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                              Win
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-lg sm:text-xl font-black tabular-nums min-w-[28px] text-right ${
                            team2Won
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}
                        >
                          {match.score2}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. EDIT STAGED MATCH DIALOG (BEFORE MATCH STARTS) */}
      {editingStagedMatch && (
        <Dialog
          isOpen={Boolean(editingStagedMatch)}
          onClose={() => setEditingStagedMatch(null)}
          title={`Edit Staged Match — ${editingStagedMatch.courtName}`}
          description="Change the assigned court or swap players with available roster members before starting."
          footer={
            <>
              <Button variant="outline" onClick={() => setEditingStagedMatch(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveStagedMatchEdit}>
                Save Matchup
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveStagedMatchEdit} className="space-y-4">
            {editError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                <span>{editError}</span>
              </div>
            )}

            {/* Court Selector */}
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Assigned Court (Change Court)
              </label>
              <select
                value={editCourtId}
                onChange={(e) => setEditCourtId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold"
              >
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name} {court.id === editingStagedMatch.courtId ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Team 1 Players */}
            <div className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 space-y-3">
              <span className="text-xs font-black uppercase text-neutral-500 block">
                Team 1 Lineup
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">Player 1</label>
                  <select
                    value={editT1P1Id}
                    onChange={(e) => setEditT1P1Id(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-bold"
                  >
                    {availableMatchCandidates.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.skillLevel ? `(Lvl ${p.skillLevel})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">Player 2</label>
                  <select
                    value={editT1P2Id}
                    onChange={(e) => setEditT1P2Id(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-bold"
                  >
                    {availableMatchCandidates.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.skillLevel ? `(Lvl ${p.skillLevel})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Team 2 Players */}
            <div className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 space-y-3">
              <span className="text-xs font-black uppercase text-neutral-500 block">
                Team 2 Lineup
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">Player 1</label>
                  <select
                    value={editT2P1Id}
                    onChange={(e) => setEditT2P1Id(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-bold"
                  >
                    {availableMatchCandidates.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.skillLevel ? `(Lvl ${p.skillLevel})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">Player 2</label>
                  <select
                    value={editT2P2Id}
                    onChange={(e) => setEditT2P2Id(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-bold"
                  >
                    {availableMatchCandidates.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.skillLevel ? `(Lvl ${p.skillLevel})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </form>
        </Dialog>
      )}

      {/* 7. ADD PLAYER MODAL */}
      <Dialog
        isOpen={isAddLateOpen}
        onClose={() => setIsAddLateOpen(false)}
        title="Add Player"
        description="Player will be placed in the roster queue and considered by the matchmaking engine for the next round."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddLateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddLateSubmit}>
              Add Player
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddLateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Player Full Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Alex Morgan"
              value={latePlayerName}
              onChange={(e) => setLatePlayerName(e.target.value)}
              className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Skill Level (Optional)
            </label>
            <select
              value={latePlayerSkill}
              onChange={(e) =>
                setLatePlayerSkill(
                  e.target.value ? (Number(e.target.value) as SkillLevel) : ''
                )
              }
              className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="">No skill level specified (Unrated / Casual)</option>
              <option value="1">1. Beginner (1.0 - 2.0)</option>
              <option value="2">2. Advanced Beginner (2.5)</option>
              <option value="3">3. Low Intermediate (3.0)</option>
              <option value="4">4. High Intermediate (3.5)</option>
              <option value="5">5. Low Advanced (4.0)</option>
              <option value="6">6. High Advanced (4.5+)</option>
            </select>
          </div>
        </form>
      </Dialog>

      {/* 8. SWITCH PLAYERS MODAL (MID-MATCH) */}
      {selectedMatchForSwitch && switchPreview && (
        <Dialog
          isOpen={Boolean(selectedMatchForSwitch)}
          onClose={() => setSelectedMatchForSwitch(null)}
          title={`Switch Players — ${selectedMatchForSwitch.courtName}`}
          description="Select two players to switch between Team 1 and Team 2. The match score is kept unchanged."
          footer={
            <>
              <Button variant="outline" onClick={() => setSelectedMatchForSwitch(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={<ArrowLeftRight className="w-5 h-5" />}
                onClick={handleConfirmSwitch}
                disabled={!selectedTeam1PlayerId || !selectedTeam2PlayerId}
              >
                Confirm Player Switch
              </Button>
            </>
          }
        >
          {switchSuccessMessage ? (
            <div className="p-4 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
              <Check className="w-6 h-6 shrink-0" />
              <p className="font-bold text-base">{switchSuccessMessage}</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5 text-sm font-semibold">
                <AlertCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  Current Score: <strong>{selectedMatchForSwitch.score1} – {selectedMatchForSwitch.score2}</strong>. The score will remain exactly {selectedMatchForSwitch.score1}–{selectedMatchForSwitch.score2} after the switch.
                </span>
              </div>

              {/* Player Selector Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Team 1 Selector */}
                <div className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 space-y-2.5">
                  <p className="text-xs font-black uppercase tracking-wider text-neutral-500">
                    Switch 1 Player From Team 1:
                  </p>
                  <div className="space-y-2">
                    {[selectedMatchForSwitch.team1Player1, selectedMatchForSwitch.team1Player2].map((p) => {
                      const isSelected = selectedTeam1PlayerId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedTeam1PlayerId(p.id)}
                          className={`w-full p-3 rounded-xl border text-left font-bold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                              : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-600'
                                  : 'border-neutral-400 bg-transparent'
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <span>{p.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-neutral-500">
                            {p.skillLevel ? `Lvl ${p.skillLevel}` : 'Unrated'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Team 2 Selector */}
                <div className="p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40 space-y-2.5">
                  <p className="text-xs font-black uppercase tracking-wider text-neutral-500">
                    Switch 1 Player From Team 2:
                  </p>
                  <div className="space-y-2">
                    {[selectedMatchForSwitch.team2Player1, selectedMatchForSwitch.team2Player2].map((p) => {
                      const isSelected = selectedTeam2PlayerId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedTeam2PlayerId(p.id)}
                          className={`w-full p-3 rounded-xl border text-left font-bold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                              : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-600'
                                  : 'border-neutral-400 bg-transparent'
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <span>{p.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-neutral-500">
                            {p.skillLevel ? `Lvl ${p.skillLevel}` : 'Unrated'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Dynamic Before & After Preview */}
              <div className="p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 space-y-2">
                <span className="text-xs font-black uppercase tracking-widest text-neutral-500 block">
                  Lineup Preview
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-bold">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex-1">
                    <span className="text-xs text-neutral-400 uppercase block">New Team 1 ({switchPreview.score1} pts)</span>
                    <span className="text-neutral-950 dark:text-white">
                      {switchPreview.newTeam1[0]} + {switchPreview.newTeam1[1]}
                    </span>
                  </div>

                  <span className="text-center text-xs font-black text-neutral-400 uppercase self-center">
                    VS
                  </span>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex-1">
                    <span className="text-xs text-neutral-400 uppercase block">New Team 2 ({switchPreview.score2} pts)</span>
                    <span className="text-neutral-950 dark:text-white">
                      {switchPreview.newTeam2[0]} + {switchPreview.newTeam2[1]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Dialog>
      )}

      {/* 9. CONFIRM FINISH MATCH DIALOG */}
      {confirmFinishMatch && (
        <Dialog
          isOpen={Boolean(confirmFinishMatch)}
          onClose={() => setConfirmFinishMatch(null)}
          title={`Finish Match on ${confirmFinishMatch.courtName}?`}
          description="Finalize this game score, record player wins/losses, update partner & opponent history, and release the court for the next round."
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirmFinishMatch(null)}>
                Resume Game
              </Button>
              <Button
                variant="primary"
                icon={<CheckCircle2 className="w-5 h-5" />}
                onClick={() => {
                  onFinishMatch(confirmFinishMatch);
                  setConfirmFinishMatch(null);
                }}
              >
                Confirm Final Score
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-center space-y-3">
              <span className="text-xs uppercase font-bold tracking-widest text-neutral-500">
                Final Scoreboard
              </span>
              <div className="text-4xl sm:text-5xl font-black tabular-nums tracking-widest text-neutral-950 dark:text-white">
                {confirmFinishMatch.score1} — {confirmFinishMatch.score2}
              </div>

              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                {confirmFinishMatch.score1 > confirmFinishMatch.score2 ? (
                  <>Winner: {confirmFinishMatch.team1Player1.name} & {confirmFinishMatch.team1Player2.name} (Team 1)</>
                ) : confirmFinishMatch.score2 > confirmFinishMatch.score1 ? (
                  <>Winner: {confirmFinishMatch.team2Player1.name} & {confirmFinishMatch.team2Player2.name} (Team 2)</>
                ) : (
                  <>Match ended in a tie ({confirmFinishMatch.score1}–{confirmFinishMatch.score2})</>
                )}
              </p>
            </div>
          </div>
        </Dialog>
      )}

      {/* 10. CONFIRM CANCEL MATCH DIALOG */}
      {confirmCancelMatch && (
        <Dialog
          isOpen={Boolean(confirmCancelMatch)}
          onClose={() => setConfirmCancelMatch(null)}
          title={`Cancel Match on ${confirmCancelMatch.courtName}?`}
          description="The match will be removed, the court will become immediately available, and the 4 players will return to the available roster without any change to their win/loss record."
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirmCancelMatch(null)}>
                Keep Match
              </Button>
              <Button
                variant="danger"
                icon={<XCircle className="w-5 h-5" />}
                onClick={() => {
                  onCancelMatch(confirmCancelMatch);
                  setConfirmCancelMatch(null);
                }}
              >
                Cancel Match
              </Button>
            </>
          }
        >
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm font-medium">
            Players ({confirmCancelMatch.team1Player1.name}, {confirmCancelMatch.team1Player2.name}, {confirmCancelMatch.team2Player1.name}, {confirmCancelMatch.team2Player2.name}) will be freed back to the available queue.
          </div>
        </Dialog>
      )}

      {/* 11. CHANGE COURTS DIALOG */}
      <Dialog
        isOpen={isChangeCourtsOpen}
        onClose={() => setIsChangeCourtsOpen(false)}
        title="Change Number of Courts"
        description="Select how many courts will be used for this open-play session."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsChangeCourtsOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<Check className="w-4 h-4" />}
              onClick={() => {
                onUpdateCourtsCount(selectedCourtsCount);
                setIsChangeCourtsOpen(false);
              }}
            >
              Update to {selectedCourtsCount} Courts
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300">
            How many courts will the event be using?
          </label>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setSelectedCourtsCount(num)}
                className={`py-2.5 px-2 rounded-xl text-sm font-black transition-all cursor-pointer ${
                  selectedCourtsCount === num
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500'
                    : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                }`}
              >
                {num} {num === 1 ? 'Court' : 'Courts'}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <span className="text-sm font-bold text-neutral-600 dark:text-neutral-400">Custom count:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={selectedCourtsCount <= 1}
                onClick={() => setSelectedCourtsCount(Math.max(1, selectedCourtsCount - 1))}
                className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-bold text-lg flex items-center justify-center disabled:opacity-40 cursor-pointer"
              >
                -
              </button>
              <span className="text-xl font-black min-w-[32px] text-center">{selectedCourtsCount}</span>
              <button
                type="button"
                disabled={selectedCourtsCount >= 24}
                onClick={() => setSelectedCourtsCount(Math.min(24, selectedCourtsCount + 1))}
                className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-bold text-lg flex items-center justify-center disabled:opacity-40 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
