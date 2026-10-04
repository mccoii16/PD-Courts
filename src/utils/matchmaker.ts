import { Court, Match, Player } from '../types';

export interface MatchmakingResult {
  matches: Match[];
  playingPlayers: Player[];
  waitingPlayers: Player[];
  courtsUsed: Court[];
  emptyCourts: Court[];
  explanation?: string;
}

export interface MatchmakingOptions {
  shuffleIndex?: number;
  randomnessWeight?: number;
  initialStatus?: 'waiting' | 'live';
}

// Helper to get effective numeric skill (defaults to 3.0 for unrated)
export function getPlayerSkill(player: Player): number {
  return player.skillLevel ?? 3;
}

/**
 * Calculates a player's priority to play in the next round.
 * Priority principles:
 * 1. Players who waited longer (higher sittingRounds) get highest priority.
 * 2. Players with fewer games played get priority.
 * 3. Players with consecutive games get deprioritized.
 * 4. Controlled random jitter for tie-breaking and variety.
 */
export function calculatePlayerPriority(player: Player, jitter: number = 0): number {
  const waitingBonus = player.sittingRounds * 20;
  const gamesPlayedPenalty = player.gamesPlayed * 12;
  const consecutiveGamesPenalty = player.consecutiveGames * 16;
  const randomJitter = (Math.random() - 0.5) * jitter;

  return waitingBonus - gamesPlayedPenalty - consecutiveGamesPenalty + randomJitter;
}

/**
 * Evaluates the fairness penalty for a 2v2 doubles match.
 * Lower penalty = fairer match.
 * Considers:
 * - Partner repeat count (heavy penalty)
 * - Opponent repeat count (moderate penalty)
 * - Team skill balance (|Team 1 Skill - Team 2 Skill|)
 */
export function evaluateMatchFairness(
  team1: [Player, Player],
  team2: [Player, Player]
): number {
  let penalty = 0;

  const [p1, p2] = team1;
  const [p3, p4] = team2;

  // 1. Partner repetition penalty (avoid same partner)
  const p1Partners = p1.partnerIds || [];
  const p2Partners = p2.partnerIds || [];
  const p3Partners = p3.partnerIds || [];
  const p4Partners = p4.partnerIds || [];

  const t1Repeats = p1Partners.filter((id) => id === p2.id).length;
  const t2Repeats = p3Partners.filter((id) => id === p4.id).length;
  penalty += (t1Repeats + t2Repeats) * 45;

  // 2. Opponent repetition penalty (avoid facing same opponents repeatedly)
  const p1Opponents = p1.opponentIds || [];
  const p2Opponents = p2.opponentIds || [];
  const p3Opponents = p3.opponentIds || [];
  const p4Opponents = p4.opponentIds || [];

  const opp1Matches = p1Opponents.filter((id) => id === p3.id || id === p4.id).length;
  const opp2Matches = p2Opponents.filter((id) => id === p3.id || id === p4.id).length;
  const opp3Matches = p3Opponents.filter((id) => id === p1.id || id === p2.id).length;
  const opp4Matches = p4Opponents.filter((id) => id === p1.id || id === p2.id).length;
  penalty += (opp1Matches + opp2Matches + opp3Matches + opp4Matches) * 10;

  // 3. Team skill balance
  const skillT1 = getPlayerSkill(p1) + getPlayerSkill(p2);
  const skillT2 = getPlayerSkill(p3) + getPlayerSkill(p4);
  const skillDifference = Math.abs(skillT1 - skillT2);
  penalty += skillDifference * 14;

  return penalty;
}

/**
 * Given 4 players for a court, finds the fairest 2v2 doubles teams.
 * There are exactly 3 possible combinations of 2v2:
 * 1. (0,1) vs (2,3)
 * 2. (0,2) vs (1,3)
 * 3. (0,3) vs (1,2)
 */
export function pairFourPlayers(
  fourPlayers: [Player, Player, Player, Player],
  randomJitter: number = 3
): { team1: [Player, Player]; team2: [Player, Player]; score: number } {
  const [a, b, c, d] = fourPlayers;

  const configurations: Array<{ team1: [Player, Player]; team2: [Player, Player] }> = [
    { team1: [a, b], team2: [c, d] },
    { team1: [a, c], team2: [b, d] },
    { team1: [a, d], team2: [b, c] },
  ];

  let bestConfig = configurations[0];
  let bestScore = Infinity;

  for (const config of configurations) {
    const fairnessPenalty = evaluateMatchFairness(config.team1, config.team2);
    // Add small random noise for variety on shuffle
    const noise = Math.random() * randomJitter;
    const totalScore = fairnessPenalty + noise;

    if (totalScore < bestScore) {
      bestScore = totalScore;
      bestConfig = config;
    }
  }

  return { ...bestConfig, score: bestScore };
}

/**
 * Main Fair Matchmaking Function.
 * Creates 2v2 doubles matches using available players and available courts.
 */
export function generateFairMatches(
  allPlayers: Player[],
  allCourts: Court[],
  options: MatchmakingOptions = {}
): MatchmakingResult {
  const activeCourts = allCourts.filter((c) => c.isActive);

  // Eligible players: Must not be marked 'unavailable'
  const eligiblePlayers = allPlayers.filter((p) => p.status !== 'unavailable');

  if (activeCourts.length === 0) {
    throw new Error('No active courts available to generate matches.');
  }

  if (eligiblePlayers.length < 4) {
    throw new Error(
      `Need at least 4 available players to create a match (currently ${eligiblePlayers.length} available).`
    );
  }

  const maxMatchesByPlayers = Math.floor(eligiblePlayers.length / 4);
  const matchesToGenerate = Math.min(activeCourts.length, maxMatchesByPlayers);
  const totalPlayersNeeded = matchesToGenerate * 4;

  const jitter = options.randomnessWeight ?? 6;

  // 1. Sort eligible players by priority
  const prioritizedPlayers = [...eligiblePlayers].sort((a, b) => {
    const priorityA = calculatePlayerPriority(a, jitter);
    const priorityB = calculatePlayerPriority(b, jitter);
    return priorityB - priorityA;
  });

  // Selected pool of players for this round
  const selectedPool = prioritizedPlayers.slice(0, totalPlayersNeeded);
  const waitingPool = prioritizedPlayers.slice(totalPlayersNeeded);

  // 2. Find best partitioning of the selected pool across the courts
  // Run several stochastic trials to find the lowest penalty assignment
  const trialCount = 40;
  let bestMatches: Match[] = [];
  let lowestTotalPenalty = Infinity;

  const targetCourts = activeCourts.slice(0, matchesToGenerate);
  const unusedCourts = activeCourts.slice(matchesToGenerate);

  const startTimeStr = new Date().toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  for (let trial = 0; trial < trialCount; trial++) {
    // Shuffle the pool slightly to try different 4-player groupings
    const shuffledPool = [...selectedPool].sort(() => Math.random() - 0.5);
    const trialMatches: Match[] = [];
    let trialPenalty = 0;

    for (let c = 0; c < matchesToGenerate; c++) {
      const court = targetCourts[c];
      const courtPlayers = shuffledPool.slice(c * 4, c * 4 + 4) as [
        Player,
        Player,
        Player,
        Player
      ];

      const bestPairing = pairFourPlayers(courtPlayers, jitter);
      trialPenalty += bestPairing.score;

      const matchStatus = options.initialStatus ?? 'waiting';
      trialMatches.push({
        id: `match-${Date.now()}-${c}-${trial}`,
        courtId: court.id,
        courtName: court.name.toUpperCase(),
        team1Player1: bestPairing.team1[0],
        team1Player2: bestPairing.team1[1],
        team2Player1: bestPairing.team2[0],
        team2Player2: bestPairing.team2[1],
        score1: 0,
        score2: 0,
        status: matchStatus,
        startedAt: matchStatus === 'live' ? startTimeStr : '',
      });
    }

    if (trialPenalty < lowestTotalPenalty) {
      lowestTotalPenalty = trialPenalty;
      bestMatches = trialMatches;
    }
  }

  return {
    matches: bestMatches,
    playingPlayers: selectedPool,
    waitingPlayers: waitingPool,
    courtsUsed: targetCourts,
    emptyCourts: unusedCourts,
    explanation: `Generated ${bestMatches.length} fair match${
      bestMatches.length === 1 ? '' : 'es'
    } for ${totalPlayersNeeded} players. ${waitingPool.length} player${
      waitingPool.length === 1 ? '' : 's'
    } waiting.`,
  };
}

/**
 * Updates player history and statuses when a generated round is applied.
 */
export function applyMatchmakingToPlayers(
  allPlayers: Player[],
  result: MatchmakingResult,
  isLive: boolean = false
): Player[] {
  const playingIds = new Set(result.playingPlayers.map((p) => p.id));
  const waitingIds = new Set(result.waitingPlayers.map((p) => p.id));

  // Map each playing player to their partner and opponents in this round
  const playerRoundContext = new Map<
    string,
    { partnerId: string; opponentIds: [string, string]; courtId: string }
  >();

  for (const match of result.matches) {
    const t1p1 = match.team1Player1.id;
    const t1p2 = match.team1Player2.id;
    const t2p1 = match.team2Player1.id;
    const t2p2 = match.team2Player2.id;

    playerRoundContext.set(t1p1, { partnerId: t1p2, opponentIds: [t2p1, t2p2], courtId: match.courtId });
    playerRoundContext.set(t1p2, { partnerId: t1p1, opponentIds: [t2p1, t2p2], courtId: match.courtId });
    playerRoundContext.set(t2p1, { partnerId: t2p2, opponentIds: [t1p1, t1p2], courtId: match.courtId });
    playerRoundContext.set(t2p2, { partnerId: t2p1, opponentIds: [t1p1, t1p2], courtId: match.courtId });
  }

  return allPlayers.map((player) => {
    // If player is unavailable, leave as unavailable
    if (player.status === 'unavailable') {
      return player;
    }

    if (playingIds.has(player.id)) {
      const context = playerRoundContext.get(player.id);
      return {
        ...player,
        status: isLive ? ('playing' as const) : ('waiting' as const),
        isActive: true,
        currentCourtId: context?.courtId || null,
        consecutiveGames: isLive ? player.consecutiveGames + 1 : player.consecutiveGames,
        sittingRounds: isLive ? 0 : player.sittingRounds,
      };
    }

    if (waitingIds.has(player.id)) {
      return {
        ...player,
        status: 'waiting' as const,
        isActive: true,
        currentCourtId: null,
        consecutiveGames: 0,
        sittingRounds: player.sittingRounds + 1,
      };
    }

    return player;
  });
}
