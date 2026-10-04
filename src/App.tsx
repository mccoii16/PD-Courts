import React, { useState, useEffect, useRef } from 'react';
import {
  NavigationTab,
  Player,
  Court,
  Match,
  PickleballEvent,
  SkillLevel,
  MatchLineupSwitch,
} from './types';
import {
  INITIAL_COURTS,
  INITIAL_EVENT,
  INITIAL_EVENTS_LIST,
  INITIAL_MATCHES,
  INITIAL_PLAYERS,
  COMPLETED_MATCHES_SAMPLE,
} from './mockData';
import { Navbar } from './components/layout/Navbar';
import { LiveMatchesView } from './components/views/LiveMatchesView';
import { EventsView } from './components/views/EventsView';
import { PlayersView } from './components/views/PlayersView';
import { ScoresView } from './components/views/ScoresView';
import { SettingsView } from './components/views/SettingsView';
import {
  generateFairMatches,
  applyMatchmakingToPlayers,
  pairFourPlayers,
} from './utils/matchmaker';

// Firebase imports
import {
  auth,
  testConnection,
  signInWithGoogle,
  logOut,
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  saveEventToFirebase,
  deleteEventFromFirebase,
  subscribeToEvents,
  savePlayerToFirebase,
  saveParticipantToFirebase,
  batchSaveParticipants,
  deleteParticipantFromFirebase,
  subscribeToEventParticipants,
  saveMatchToFirebase,
  deleteMatchFromFirebase,
  subscribeToEventMatches,
  recordPlayerSwitchInFirebase,
} from './services/firebaseService';
import { Cloud, Sparkles, CheckCircle2 } from 'lucide-react';

// Clear any legacy mock data on startup so the app opens clean
if (typeof window !== 'undefined') {
  const HAS_CLEANED = localStorage.getItem('pb_clean_courts_prompt_v3');
  if (!HAS_CLEANED) {
    localStorage.removeItem('pb_players');
    localStorage.removeItem('pb_matches');
    localStorage.removeItem('pb_completed_matches');
    localStorage.removeItem('pb_events');
    localStorage.removeItem('pb_active_event_id');
    localStorage.setItem('pb_clean_courts_prompt_v3', 'true');
  }
}

// Helper to generate flexible court objects
function createCourtsList(count: number, existingCourts: Court[] = []): Court[] {
  if (count <= 0) return [];
  const result: Court[] = [];
  for (let i = 1; i <= count; i++) {
    const existing = existingCourts.find((c) => c.courtNumber === i);
    if (existing) {
      result.push(existing);
    } else {
      result.push({
        id: `c${i}`,
        courtNumber: i,
        name: `Court ${i}`,
        isActive: true,
        currentMatchId: null,
      });
    }
  }
  return result;
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('live');
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pickleball_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Events state
  const [events, setEvents] = useState<PickleballEvent[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pb_events');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return INITIAL_EVENTS_LIST;
  });

  const [activeEventId, setActiveEventId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pb_active_event_id');
      if (saved) return saved;
    }
    return INITIAL_EVENT.id;
  });

  // Active event object
  const activeEvent =
    events.find((e) => e.id === activeEventId) || events[0] || INITIAL_EVENT;

  // Courts state synced to active event court count (starts empty if court count not chosen)
  const [courts, setCourts] = useState<Court[]>(() => {
    if (activeEvent.courtsCount && activeEvent.courtsCount > 0) {
      return createCourtsList(activeEvent.courtsCount, INITIAL_COURTS);
    }
    return [];
  });

  // Players state - Starts empty by default
  const [players, setPlayers] = useState<Player[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pb_players');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [];
  });

  // Matches state (live and staged waiting) - Starts empty by default
  const [matches, setMatches] = useState<Match[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pb_matches');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [];
  });

  // Completed matches state - Starts empty by default
  const [completedMatches, setCompletedMatches] = useState<Match[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pb_completed_matches');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [];
  });

  // Matchmaker feedback toast message
  const [matchmakerFeedback, setMatchmakerFeedback] = useState<string | null>(null);

  // Guard against seeding multiple times
  const hasSeededFirestore = useRef(false);

  // Initialize Firebase Auth listener and connection check
  useEffect(() => {
    testConnection().then((connected) => {
      setIsCloudConnected(connected);
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore subscriptions when user is authenticated
  useEffect(() => {
    if (!user) return;

    // 1. Subscribe to Events
    const unsubEvents = subscribeToEvents(
      async (firebaseEvents) => {
        if (firebaseEvents.length > 0) {
          setEvents(firebaseEvents);
          // Verify activeEventId exists in incoming events
          if (!firebaseEvents.some((e) => e.id === activeEventId)) {
            setActiveEventId(firebaseEvents[0].id);
          }
        } else if (!hasSeededFirestore.current) {
          // First time connected: Seed initial event configuration ONLY (no mock players or matches)
          hasSeededFirestore.current = true;
          for (const ev of INITIAL_EVENTS_LIST) {
            await saveEventToFirebase(ev);
          }
        }
      },
      (err) => console.warn('Events sync notice:', err.message)
    );

    return () => unsubEvents();
  }, [user]);

  // Subscribe to Event Participants for activeEventId
  useEffect(() => {
    if (!user || !activeEventId) return;

    const unsubParticipants = subscribeToEventParticipants(
      activeEventId,
      (participants) => {
        if (participants.length > 0) {
          setPlayers(participants);
        }
      },
      (err) => console.warn('Participants sync notice:', err.message)
    );

    return () => unsubParticipants();
  }, [user, activeEventId]);

  // Subscribe to Event Matches for activeEventId
  useEffect(() => {
    if (!user || !activeEventId) return;

    const unsubMatches = subscribeToEventMatches(
      activeEventId,
      (firebaseMatches) => {
        if (firebaseMatches.length > 0) {
          const activeList = firebaseMatches.filter((m) => m.status !== 'completed');
          const finishedList = firebaseMatches.filter((m) => m.status === 'completed');

          setMatches(activeList);
          setCompletedMatches(finishedList);

          // Update court assignments
          setCourts((prev) =>
            prev.map((court) => {
              const liveOnCourt = activeList.find(
                (m) => m.courtId === court.id && m.status === 'live'
              );
              return {
                ...court,
                currentMatchId: liveOnCourt ? liveOnCourt.id : null,
              };
            })
          );
        }
      },
      (err) => console.warn('Matches sync notice:', err.message)
    );

    return () => unsubMatches();
  }, [user, activeEventId]);

  // Theme effect
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('pickleball_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('pickleball_theme', 'light');
    }
  }, [isDark]);

  // Persist state in localStorage as backup and instant local reload
  useEffect(() => {
    localStorage.setItem('pb_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('pb_active_event_id', activeEventId);
  }, [activeEventId]);

  useEffect(() => {
    localStorage.setItem('pb_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('pb_matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('pb_completed_matches', JSON.stringify(completedMatches));
  }, [completedMatches]);

  // Sync courts when active event changes or courtsCount changes
  useEffect(() => {
    setCourts((prev) => {
      if (!activeEvent.courtsCount || activeEvent.courtsCount <= 0) {
        return [];
      }
      if (prev.length !== activeEvent.courtsCount) {
        return createCourtsList(activeEvent.courtsCount, prev);
      }
      return prev;
    });
  }, [activeEvent.courtsCount]);

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleSignIn = async () => {
    try {
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        setMatchmakerFeedback(`Signed in as ${loggedUser.displayName || loggedUser.email}. Cloud sync active!`);
        setTimeout(() => setMatchmakerFeedback(null), 5000);
      }
    } catch (e: any) {
      setMatchmakerFeedback(e.message || 'Sign in cancelled or unavailable.');
      setTimeout(() => setMatchmakerFeedback(null), 5000);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setMatchmakerFeedback('Signed out. Local session preserved.');
      setTimeout(() => setMatchmakerFeedback(null), 4000);
    } catch (e: any) {
      console.error(e);
    }
  };

  // --- MATCHMAKING & NEXT ROUND (PHASE 5, 7 & 8) ---

  const handleGenerateNextRound = () => {
    try {
      const openCourts = courts.filter(
        (c) => c.isActive && !matches.some((m) => m.courtId === c.id && m.status === 'live')
      );

      const livePlayerIds = new Set(
        matches
          .filter((m) => m.status === 'live')
          .flatMap((m) => [m.team1Player1.id, m.team1Player2.id, m.team2Player1.id, m.team2Player2.id])
      );

      const candidatePlayers = players.filter(
        (p) => p.status !== 'unavailable' && !livePlayerIds.has(p.id)
      );

      if (openCourts.length === 0) {
        setMatchmakerFeedback(
          'All active courts currently have live matches running. Finish or cancel a match to open a court for the next round.'
        );
        setTimeout(() => setMatchmakerFeedback(null), 5000);
        return;
      }

      if (candidatePlayers.length < 4) {
        setMatchmakerFeedback(
          `Need at least 4 available players to form the next round (currently ${candidatePlayers.length} available).`
        );
        setTimeout(() => setMatchmakerFeedback(null), 5000);
        return;
      }

      // Generate staged matches
      const result = generateFairMatches(candidatePlayers, openCourts, {
        initialStatus: 'waiting',
      });

      const existingLiveMatches = matches.filter((m) => m.status === 'live');
      const updatedMatches = [...existingLiveMatches, ...result.matches];

      setMatches(updatedMatches);
      const updatedPlayers = applyMatchmakingToPlayers(players, result, false);
      setPlayers(updatedPlayers);

      // Cloud sync
      if (user) {
        result.matches.forEach((m) => saveMatchToFirebase(activeEventId, m));
        batchSaveParticipants(activeEventId, updatedPlayers);
      }

      setMatchmakerFeedback(
        `Next round staged! ${result.matches.length} match${
          result.matches.length === 1 ? '' : 'es'
        } generated (${result.waitingPlayers.length} resting in queue). Tap "Start Match" on each court when ready.`
      );
      setTimeout(() => setMatchmakerFeedback(null), 7000);
    } catch (err: any) {
      setMatchmakerFeedback(err.message || 'Unable to generate next round.');
      setTimeout(() => setMatchmakerFeedback(null), 5000);
    }
  };

  const handleShuffleMatches = () => {
    try {
      const openCourts = courts.filter(
        (c) => c.isActive && !matches.some((m) => m.courtId === c.id && m.status === 'live')
      );

      const livePlayerIds = new Set(
        matches
          .filter((m) => m.status === 'live')
          .flatMap((m) => [m.team1Player1.id, m.team1Player2.id, m.team2Player1.id, m.team2Player2.id])
      );

      const candidatePlayers = players.filter(
        (p) => p.status !== 'unavailable' && !livePlayerIds.has(p.id)
      );

      const result = generateFairMatches(candidatePlayers, openCourts, {
        initialStatus: 'waiting',
        randomnessWeight: 14,
      });

      const existingLiveMatches = matches.filter((m) => m.status === 'live');
      const updatedMatches = [...existingLiveMatches, ...result.matches];
      setMatches(updatedMatches);
      const updatedPlayers = applyMatchmakingToPlayers(players, result, false);
      setPlayers(updatedPlayers);

      // Cloud sync
      if (user) {
        result.matches.forEach((m) => saveMatchToFirebase(activeEventId, m));
        batchSaveParticipants(activeEventId, updatedPlayers);
      }

      setMatchmakerFeedback(
        `Shuffled staged matches into an alternative fair 2v2 configuration (${result.matches.length} matches staged).`
      );
      setTimeout(() => setMatchmakerFeedback(null), 6000);
    } catch (err: any) {
      setMatchmakerFeedback(err.message || 'Unable to shuffle matches.');
      setTimeout(() => setMatchmakerFeedback(null), 5000);
    }
  };

  // Start a single staged match manually
  const handleStartMatch = (matchId: string) => {
    const timeNow = new Date().toISOString();
    let targetMatch: Match | undefined;

    setMatches((prev) =>
      prev.map((match) => {
        if (match.id !== matchId) return match;
        targetMatch = {
          ...match,
          status: 'live',
          startedAt: timeNow,
        };
        return targetMatch;
      })
    );

    if (targetMatch) {
      const assignedCourtId = (targetMatch as Match).courtId;
      setCourts((prev) =>
        prev.map((c) => (c.id === assignedCourtId ? { ...c, currentMatchId: matchId } : c))
      );

      const playingIds = new Set([
        (targetMatch as Match).team1Player1.id,
        (targetMatch as Match).team1Player2.id,
        (targetMatch as Match).team2Player1.id,
        (targetMatch as Match).team2Player2.id,
      ]);

      const updatedPlayers = players.map((p) => {
        if (playingIds.has(p.id)) {
          return {
            ...p,
            status: 'playing' as const,
            currentCourtId: assignedCourtId,
            consecutiveGames: p.consecutiveGames + 1,
            sittingRounds: 0,
          };
        }
        return p;
      });
      setPlayers(updatedPlayers);

      // Cloud sync
      if (user) {
        saveMatchToFirebase(activeEventId, targetMatch as Match);
        batchSaveParticipants(activeEventId, updatedPlayers);
      }
    }

    setMatchmakerFeedback('Match started and game clock running.');
    setTimeout(() => setMatchmakerFeedback(null), 4000);
  };

  // Start all staged matches simultaneously
  const handleStartAllMatches = () => {
    const timeNow = new Date().toISOString();
    const startedMatchIds = new Set<string>();
    const startedCourtIds = new Map<string, string>();
    const updatedMatchList: Match[] = [];

    setMatches((prev) => {
      const result = prev.map((match) => {
        if (match.status === 'waiting') {
          startedMatchIds.add(match.id);
          startedCourtIds.set(match.team1Player1.id, match.courtId);
          startedCourtIds.set(match.team1Player2.id, match.courtId);
          startedCourtIds.set(match.team2Player1.id, match.courtId);
          startedCourtIds.set(match.team2Player2.id, match.courtId);
          const liveM: Match = {
            ...match,
            status: 'live',
            startedAt: timeNow,
          };
          updatedMatchList.push(liveM);
          return liveM;
        }
        return match;
      });
      return result;
    });

    const updatedPlayers = players.map((p) => {
      const courtId = startedCourtIds.get(p.id);
      if (courtId) {
        return {
          ...p,
          status: 'playing' as const,
          currentCourtId: courtId,
          consecutiveGames: p.consecutiveGames + 1,
          sittingRounds: 0,
        };
      }
      return p;
    });
    setPlayers(updatedPlayers);

    // Cloud sync
    if (user) {
      updatedMatchList.forEach((m) => saveMatchToFirebase(activeEventId, m));
      batchSaveParticipants(activeEventId, updatedPlayers);
    }

    setMatchmakerFeedback(`Started all ${startedMatchIds.size} staged matches.`);
    setTimeout(() => setMatchmakerFeedback(null), 4000);
  };

  // Edit match before it starts (staged)
  const handleEditStagedMatch = (updatedMatch: Match) => {
    const oldMatch = matches.find((m) => m.id === updatedMatch.id);
    const oldParticipantIds = oldMatch
      ? [oldMatch.team1Player1.id, oldMatch.team1Player2.id, oldMatch.team2Player1.id, oldMatch.team2Player2.id]
      : [];

    const newParticipantIds = new Set([
      updatedMatch.team1Player1.id,
      updatedMatch.team1Player2.id,
      updatedMatch.team2Player1.id,
      updatedMatch.team2Player2.id,
    ]);

    setMatches((prev) => prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m)));

    const updatedPlayers = players.map((p) => {
      if (newParticipantIds.has(p.id)) {
        return { ...p, currentCourtId: updatedMatch.courtId };
      }
      if (oldParticipantIds.includes(p.id)) {
        return { ...p, currentCourtId: null, status: 'waiting' as const };
      }
      return p;
    });
    setPlayers(updatedPlayers);

    // Cloud sync
    if (user) {
      saveMatchToFirebase(activeEventId, updatedMatch);
      batchSaveParticipants(activeEventId, updatedPlayers);
    }

    setMatchmakerFeedback(`Updated match configuration on ${updatedMatch.courtName}.`);
    setTimeout(() => setMatchmakerFeedback(null), 5000);
  };

  // Regenerate a single court's match
  const handleRegenerateSingleMatch = (match: Match) => {
    const fourPlayers: [Player, Player, Player, Player] = [
      match.team1Player1,
      match.team1Player2,
      match.team2Player1,
      match.team2Player2,
    ];

    const bestPairing = pairFourPlayers(fourPlayers, 15);
    const regenerated: Match = {
      ...match,
      team1Player1: bestPairing.team1[0],
      team1Player2: bestPairing.team1[1],
      team2Player1: bestPairing.team2[0],
      team2Player2: bestPairing.team2[1],
    };

    setMatches((prev) => prev.map((m) => (m.id === match.id ? regenerated : m)));

    // Cloud sync
    if (user) {
      saveMatchToFirebase(activeEventId, regenerated);
    }

    setMatchmakerFeedback(`Re-paired 2v2 teams on ${match.courtName}.`);
    setTimeout(() => setMatchmakerFeedback(null), 5000);
  };

  // Add late player directly to waiting queue
  const handleAddLatePlayer = (name: string, skillLevel?: SkillLevel) => {
    const newPlayer: Player = {
      id: `p-late-${Date.now()}`,
      name,
      skillLevel,
      status: 'available',
      isActive: true,
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      sittingRounds: 0,
      consecutiveGames: 0,
      partnerIds: [],
      opponentIds: [],
    };

    setPlayers((prev) => [newPlayer, ...prev]);

    // Cloud sync
    if (user) {
      savePlayerToFirebase(newPlayer);
      saveParticipantToFirebase(activeEventId, newPlayer);
    }

    setMatchmakerFeedback(`Added ${name} to waiting queue. Matchmaker will include them in the next round.`);
    setTimeout(() => setMatchmakerFeedback(null), 6000);
  };

  // Switch players during a live match
  const handleApplyPlayerSwitch = (matchId: string, player1Id: string, player2Id: string) => {
    const targetMatch = matches.find((m) => m.id === matchId);
    if (!targetMatch) return;

    const t1p1 = targetMatch.team1Player1;
    const t1p2 = targetMatch.team1Player2;
    const t2p1 = targetMatch.team2Player1;
    const t2p2 = targetMatch.team2Player2;

    const switchingFromT1 = player1Id === t1p1.id ? t1p1 : t1p2;
    const stayingOnT1 = player1Id === t1p1.id ? t1p2 : t1p1;

    const switchingFromT2 = player2Id === t2p1.id ? t2p1 : t2p2;
    const stayingOnT2 = player2Id === t2p1.id ? t2p2 : t2p1;

    const newTeam1: [Player, Player] = [stayingOnT1, switchingFromT2];
    const newTeam2: [Player, Player] = [stayingOnT2, switchingFromT1];

    const switchRecord: MatchLineupSwitch & { id: string; matchId: string } = {
      id: `sw-${Date.now()}`,
      matchId,
      eventId: activeEventId,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      originalTeam1: [t1p1.name, t1p2.name],
      originalTeam2: [t2p1.name, t2p2.name],
      newTeam1: [newTeam1[0].name, newTeam1[1].name],
      newTeam2: [newTeam2[0].name, newTeam2[1].name],
      switchedPlayerIds: [switchingFromT1.name, switchingFromT2.name],
      scoreAtSwitch1: targetMatch.score1,
      scoreAtSwitch2: targetMatch.score2,
    };

    const updatedMatch: Match = {
      ...targetMatch,
      team1Player1: newTeam1[0],
      team1Player2: newTeam1[1],
      team2Player1: newTeam2[0],
      team2Player2: newTeam2[1],
      currentPlayers: [newTeam1[0], newTeam1[1], newTeam2[0], newTeam2[1]],
      switches: [...(targetMatch.switches || []), switchRecord],
    };

    setMatches((prev) => prev.map((m) => (m.id === matchId ? updatedMatch : m)));

    // Cloud sync
    if (user) {
      saveMatchToFirebase(activeEventId, updatedMatch);
      recordPlayerSwitchInFirebase(activeEventId, switchRecord);
    }

    setMatchmakerFeedback(
      `Switched ${switchingFromT1.name} ↔ ${switchingFromT2.name}. Score preserved at ${targetMatch.score1}–${targetMatch.score2}.`
    );
    setTimeout(() => setMatchmakerFeedback(null), 5000);
  };

  // Adjust score
  const handleScoreChange = (matchId: string, team: 1 | 2, delta: number) => {
    let updatedMatch: Match | undefined;

    setMatches((prev) =>
      prev.map((match) => {
        if (match.id !== matchId) return match;
        const newScore1 = team === 1 ? Math.max(0, match.score1 + delta) : match.score1;
        const newScore2 = team === 2 ? Math.max(0, match.score2 + delta) : match.score2;
        updatedMatch = {
          ...match,
          score1: newScore1,
          score2: newScore2,
        };
        return updatedMatch;
      })
    );

    // Cloud sync
    if (user && updatedMatch) {
      saveMatchToFirebase(activeEventId, updatedMatch);
    }
  };

  // Finish match
  const handleFinishMatch = (match: Match) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const matchNumber = completedMatches.length + 1;
    const roundNumber = Math.ceil(matchNumber / Math.max(1, courts.length));

    // Calculate actual elapsed minutes
    let durationMinutes = 15;
    if (match.startedAt) {
      const startTime = new Date(match.startedAt).getTime();
      if (!isNaN(startTime)) {
        durationMinutes = Math.max(1, Math.round((Date.now() - startTime) / 60000));
      }
    }

    const finalizedMatch: Match = {
      ...match,
      matchNumber,
      roundNumber,
      status: 'completed',
      completedAt: timeNow,
      durationMinutes,
      winnerTeam: match.score1 > match.score2 ? 1 : match.score2 > match.score1 ? 2 : 'tie',
    };

    setCompletedMatches((prev) => [finalizedMatch, ...prev]);
    setMatches((prev) => prev.filter((m) => m.id !== match.id));

    setCourts((prev) =>
      prev.map((c) => (c.id === match.courtId ? { ...c, currentMatchId: null } : c))
    );

    const team1Won = match.score1 > match.score2;
    const team2Won = match.score2 > match.score1;

    const t1p1Id = match.team1Player1.id;
    const t1p2Id = match.team1Player2.id;
    const t2p1Id = match.team2Player1.id;
    const t2p2Id = match.team2Player2.id;

    const updatedPlayers = players.map((p) => {
      if (p.id === t1p1Id || p.id === t1p2Id) {
        const partnerId = p.id === t1p1Id ? t1p2Id : t1p1Id;
        const opponentIdsToAdd = [t2p1Id, t2p2Id];
        return {
          ...p,
          status: 'available' as const,
          isActive: true,
          currentCourtId: null,
          gamesPlayed: p.gamesPlayed + 1,
          gamesWon: p.gamesWon + (team1Won ? 1 : 0),
          gamesLost: p.gamesLost + (team2Won ? 1 : 0),
          partnerIds: [...(p.partnerIds || []), partnerId],
          opponentIds: [...(p.opponentIds || []), ...opponentIdsToAdd],
        };
      }

      if (p.id === t2p1Id || p.id === t2p2Id) {
        const partnerId = p.id === t2p1Id ? t2p2Id : t2p1Id;
        const opponentIdsToAdd = [t1p1Id, t1p2Id];
        return {
          ...p,
          status: 'available' as const,
          isActive: true,
          currentCourtId: null,
          gamesPlayed: p.gamesPlayed + 1,
          gamesWon: p.gamesWon + (team2Won ? 1 : 0),
          gamesLost: p.gamesLost + (team1Won ? 1 : 0),
          partnerIds: [...(p.partnerIds || []), partnerId],
          opponentIds: [...(p.opponentIds || []), ...opponentIdsToAdd],
        };
      }

      return p;
    });
    setPlayers(updatedPlayers);

    // Cloud sync
    if (user) {
      saveMatchToFirebase(activeEventId, finalizedMatch);
      batchSaveParticipants(activeEventId, updatedPlayers);
    }

    setMatchmakerFeedback(
      `Finished ${match.courtName} (${match.score1}-${match.score2}). Court and players are now available for the next round!`
    );
    setTimeout(() => setMatchmakerFeedback(null), 5000);
  };

  // Cancel match
  const handleCancelMatch = (match: Match) => {
    setMatches((prev) => prev.filter((m) => m.id !== match.id));
    setCourts((prev) =>
      prev.map((c) => (c.id === match.courtId ? { ...c, currentMatchId: null } : c))
    );

    const participantIds = new Set([
      match.team1Player1.id,
      match.team1Player2.id,
      match.team2Player1.id,
      match.team2Player2.id,
    ]);

    const updatedPlayers = players.map((p) =>
      participantIds.has(p.id)
        ? {
            ...p,
            status: 'available' as const,
            currentCourtId: null,
          }
        : p
    );
    setPlayers(updatedPlayers);

    // Cloud sync
    if (user) {
      deleteMatchFromFirebase(activeEventId, match.id);
      batchSaveParticipants(activeEventId, updatedPlayers);
    }

    setMatchmakerFeedback(`Cancelled match on ${match.courtName}. Court and players returned to queue.`);
    setTimeout(() => setMatchmakerFeedback(null), 5000);
  };

  // --- EVENT HANDLERS ---
  const handleCreateEvent = async (eventData: Omit<PickleballEvent, 'id'>) => {
    const newEvent: PickleballEvent = {
      ...eventData,
      id: `ev-${Date.now()}`,
    };
    setEvents((prev) => [newEvent, ...prev]);
    setActiveEventId(newEvent.id);
    setCourts(createCourtsList(newEvent.courtsCount));
    setCurrentTab('live');

    // Cloud sync
    if (user) {
      await saveEventToFirebase(newEvent);
      await batchSaveParticipants(newEvent.id, players);
    }

    setMatchmakerFeedback(`Created event "${newEvent.name}".`);
    setTimeout(() => setMatchmakerFeedback(null), 4000);
  };

  const handleUpdateEvent = async (updatedEvent: PickleballEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
    if (updatedEvent.id === activeEventId) {
      setCourts((prev) => createCourtsList(updatedEvent.courtsCount, prev));
    }

    // Cloud sync
    if (user) {
      await saveEventToFirebase(updatedEvent);
    }
  };

  const handleSelectActiveEvent = (event: PickleballEvent) => {
    setActiveEventId(event.id);
    setCourts((prev) => createCourtsList(event.courtsCount, prev));
  };

  const handleDeleteEvent = async (eventId: string) => {
    setEvents((prev) => {
      const remaining = prev.filter((e) => e.id !== eventId);
      if (remaining.length === 0) {
        const freshEvent: PickleballEvent = {
          id: `ev-${Date.now()}`,
          name: 'Open Play Session',
          date: new Date().toISOString().split('T')[0],
          startTime: '08:00',
          time: '8:00 AM',
          location: 'Pickleball Center BGC',
          courtsCount: 3,
          status: 'active',
          notes: '',
        };
        setActiveEventId(freshEvent.id);
        setCourts(createCourtsList(3));
        if (user) {
          saveEventToFirebase(freshEvent);
        }
        return [freshEvent];
      }
      if (activeEventId === eventId && remaining.length > 0) {
        setActiveEventId(remaining[0].id);
        setCourts(createCourtsList(remaining[0].courtsCount));
      }
      return remaining;
    });

    // Cloud sync
    if (user) {
      await deleteEventFromFirebase(eventId);
    }
  };

  // --- PLAYER HANDLERS ---
  const handleAddPlayer = async (newPlayerData: Partial<Player>) => {
    const newPlayer: Player = {
      id: `p-${Date.now()}`,
      name: newPlayerData.name || 'New Player',
      photoUrl: newPlayerData.photoUrl,
      skillLevel: newPlayerData.skillLevel,
      status: newPlayerData.status || 'available',
      isActive: (newPlayerData.status || 'available') !== 'unavailable',
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      sittingRounds: 0,
      consecutiveGames: 0,
      partnerIds: [],
      opponentIds: [],
    };
    setPlayers((prev) => [newPlayer, ...prev]);

    // Cloud sync
    if (user) {
      await savePlayerToFirebase(newPlayer);
      await saveParticipantToFirebase(activeEventId, newPlayer);
    }
  };

  const handleEditPlayer = async (updatedPlayer: Player) => {
    setPlayers((prev) => prev.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p)));

    // Cloud sync
    if (user) {
      await savePlayerToFirebase(updatedPlayer);
      await saveParticipantToFirebase(activeEventId, updatedPlayer);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));

    setMatches((prev) => {
      const affectedStagedMatch = prev.find(
        (m) =>
          m.status === 'waiting' &&
          (m.team1Player1.id === playerId ||
            m.team1Player2.id === playerId ||
            m.team2Player1.id === playerId ||
            m.team2Player2.id === playerId)
      );
      if (affectedStagedMatch) {
        if (user) deleteMatchFromFirebase(activeEventId, affectedStagedMatch.id);
        return prev.filter((m) => m.id !== affectedStagedMatch.id);
      }
      return prev;
    });

    // Cloud sync
    if (user) {
      await deleteParticipantFromFirebase(activeEventId, playerId);
    }

    setMatchmakerFeedback('Player removed from active roster. Previous match history and stats remain intact.');
    setTimeout(() => setMatchmakerFeedback(null), 5000);
  };

  const handleTogglePlayerStatus = async (player: Player) => {
    const nextStatus = player.status === 'unavailable' ? 'available' : 'unavailable';
    const updated: Player = {
      ...player,
      status: nextStatus,
      isActive: nextStatus !== 'unavailable',
      currentCourtId: nextStatus === 'unavailable' ? null : player.currentCourtId,
    };
    await handleEditPlayer(updated);
  };

  const handleCheckInAll = async () => {
    const updatedList = players.map((p) =>
      p.status === 'unavailable' ? { ...p, status: 'available' as const, isActive: true } : p
    );
    setPlayers(updatedList);

    // Cloud sync
    if (user) {
      await batchSaveParticipants(activeEventId, updatedList);
    }
  };

  const handleAddBatchPlayers = async (count: number = 10) => {
    const sampleNames = [
      'Sam Houston',
      'Jessica Alba',
      'Victor Cruz',
      'Brooke Shields',
      'Nathan Drake',
      'Kelly Clarkson',
      'Oliver Queen',
      'Diana Prince',
      'Barry Allen',
      'Bruce Wayne',
      'Clark Kent',
      'Hal Jordan',
      'Arthur Curry',
      'Zatanna Zatara',
    ];

    const currentNames = new Set(players.map((p) => p.name));
    const availableNames = sampleNames.filter((name) => !currentNames.has(name));

    const newBatch: Player[] = [];
    for (let i = 0; i < count; i++) {
      const name = availableNames[i] || `Player ${players.length + i + 1}`;
      const randomSkill = (Math.floor(Math.random() * 6) + 1) as SkillLevel;
      newBatch.push({
        id: `p-batch-${Date.now()}-${i}`,
        name,
        skillLevel: randomSkill,
        status: 'available',
        isActive: true,
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        sittingRounds: 0,
        consecutiveGames: 0,
        partnerIds: [],
        opponentIds: [],
      });
    }

    setPlayers((prev) => [...prev, ...newBatch]);

    // Cloud sync
    if (user) {
      await batchSaveParticipants(activeEventId, newBatch);
    }
  };

  // Update courts count for active event
  const handleUpdateCourtsCount = (count: number) => {
    const updatedEvent: PickleballEvent = {
      ...activeEvent,
      courtsCount: count,
    };
    setCourts(createCourtsList(count));
    setEvents((prev) => prev.map((e) => (e.id === activeEventId ? updatedEvent : e)));
    if (user) {
      saveEventToFirebase(updatedEvent);
    }
    setMatchmakerFeedback(`Configured ${count} court${count === 1 ? '' : 's'} for this session.`);
    setTimeout(() => setMatchmakerFeedback(null), 4000);
  };

  // Clear all session players and games (Start clean)
  const handleClearAllData = () => {
    localStorage.removeItem('pb_players');
    localStorage.removeItem('pb_matches');
    localStorage.removeItem('pb_completed_matches');
    setPlayers([]);
    setMatches([]);
    setCompletedMatches([]);
    setCourts([]);
    const resetEvent: PickleballEvent = {
      ...activeEvent,
      courtsCount: 0,
    };
    setEvents((prev) => prev.map((e) => (e.id === activeEventId ? resetEvent : e)));
    if (user) {
      saveEventToFirebase(resetEvent);
    }
    setMatchmakerFeedback('Session roster and matches cleared. Ready for a clean start!');
    setTimeout(() => setMatchmakerFeedback(null), 4000);
  };

  // Optional: Load sample demo roster and matches for testing
  const handleLoadDemoData = () => {
    setPlayers(INITIAL_PLAYERS);
    setMatches(INITIAL_MATCHES);
    setCompletedMatches(COMPLETED_MATCHES_SAMPLE);
    setCourts(createCourtsList(3, INITIAL_COURTS));
    handleUpdateCourtsCount(3);
    setMatchmakerFeedback('Loaded sample demo players and matches.');
    setTimeout(() => setMatchmakerFeedback(null), 4000);
  };

  const liveMatchesCount = matches.filter((m) => m.status === 'live').length;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 transition-colors overflow-x-hidden w-full">
      {/* Top Navbar with Google Auth and Theme Toggle */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        activeMatchCount={liveMatchesCount}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Main Responsive Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12 overflow-x-hidden">
        {currentTab === 'live' && (
          <LiveMatchesView
            courts={courts}
            matches={matches}
            completedMatches={completedMatches}
            players={players}
            onScoreChange={handleScoreChange}
            onStartMatch={handleStartMatch}
            onStartAllMatches={handleStartAllMatches}
            onFinishMatch={handleFinishMatch}
            onCancelMatch={handleCancelMatch}
            onApplyPlayerSwitch={handleApplyPlayerSwitch}
            onGenerateNextRound={handleGenerateNextRound}
            onShuffleMatches={handleShuffleMatches}
            onEditStagedMatch={handleEditStagedMatch}
            onRegenerateSingleMatch={handleRegenerateSingleMatch}
            onAddLatePlayer={handleAddLatePlayer}
            onUpdateCourtsCount={handleUpdateCourtsCount}
            matchmakerFeedback={matchmakerFeedback}
          />
        )}

        {currentTab === 'events' && (
          <EventsView
            events={events}
            activeEvent={activeEvent}
            courts={courts}
            playerCount={players.length}
            onCreateEvent={handleCreateEvent}
            onUpdateEvent={handleUpdateEvent}
            onSelectActiveEvent={handleSelectActiveEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        )}

        {currentTab === 'players' && (
          <PlayersView
            players={players}
            onAddPlayer={handleAddPlayer}
            onEditPlayer={handleEditPlayer}
            onRemovePlayer={handleRemovePlayer}
            onTogglePlayerStatus={handleTogglePlayerStatus}
            onCheckInAll={handleCheckInAll}
            onAddBatchPlayers={handleAddBatchPlayers}
          />
        )}

        {currentTab === 'scores' && (
          <ScoresView
            completedMatches={completedMatches}
            players={players}
            courts={courts}
            currentEvent={activeEvent}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            isDark={isDark}
            onToggleTheme={handleToggleTheme}
            courtsCount={courts.length}
            onUpdateCourtsCount={(count) => {
              handleUpdateEvent({ ...activeEvent, courtsCount: count });
            }}
            onResetSampleData={handleClearAllData}
            onLoadDemoData={handleLoadDemoData}
          />
        )}
      </main>

      {/* Discreet Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-6 px-4 text-center text-xs text-neutral-500 dark:text-neutral-500 hidden md:block">
        <p>PDC · Built for open play and club organizers · Powered by Firebase</p>
      </footer>
    </div>
  );
}
