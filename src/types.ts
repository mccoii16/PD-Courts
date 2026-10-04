export type SkillLevel = 1 | 2 | 3 | 4 | 5 | 6;

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  1: 'Beginner (1.0 - 2.0)',
  2: 'Advanced Beginner (2.5)',
  3: 'Low Intermediate (3.0)',
  4: 'High Intermediate (3.5)',
  5: 'Low Advanced (4.0)',
  6: 'High Advanced (4.5+)',
};

export const SKILL_LEVEL_SHORT_LABELS: Record<SkillLevel, string> = {
  1: 'Beginner',
  2: 'Adv. Beginner',
  3: 'Low Inter.',
  4: 'High Inter.',
  5: 'Low Adv.',
  6: 'High Adv.',
};

export type PlayerStatus = 'available' | 'playing' | 'waiting' | 'unavailable';

export const PLAYER_STATUS_LABELS: Record<PlayerStatus, string> = {
  available: 'Available',
  playing: 'Playing',
  waiting: 'Waiting',
  unavailable: 'Unavailable',
};

export interface Player {
  id: string;
  name: string;
  photoUrl?: string;
  skillLevel?: SkillLevel;
  status: PlayerStatus;
  isActive: boolean; // true if checked in / ready
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  currentCourtId?: string | null;
  sittingRounds: number;
  consecutiveGames: number;
  partnerIds?: string[];
  opponentIds?: string[];
  hasLeftEvent?: boolean;
}

export interface Court {
  id: string;
  courtNumber: number;
  name: string;
  isActive: boolean;
  currentMatchId?: string | null;
}

export interface MatchLineupSwitch {
  id?: string;
  matchId?: string;
  eventId?: string;
  timestamp: string;
  originalTeam1: [string, string];
  originalTeam2: [string, string];
  newTeam1: [string, string];
  newTeam2: [string, string];
  switchedPlayerIds: [string, string];
  scoreAtSwitch1?: number;
  scoreAtSwitch2?: number;
}

export interface Match {
  id: string;
  eventId?: string;
  courtId: string;
  courtName: string;
  roundNumber?: number;
  matchNumber?: number;
  durationMinutes?: number;
  team1Player1: Player;
  team1Player2: Player;
  team2Player1: Player;
  team2Player2: Player;
  originalPlayers?: [Player, Player, Player, Player];
  currentPlayers?: [Player, Player, Player, Player];
  score1: number;
  score2: number;
  winnerTeam?: 1 | 2 | 'tie' | null;
  status: 'live' | 'completed' | 'paused' | 'waiting';
  startedAt: string;
  completedAt?: string;
  switches?: MatchLineupSwitch[];
}

export interface PickleballEvent {
  id: string;
  name: string;
  date: string;
  startTime: string;
  time?: string;
  location: string;
  courtsCount: number;
  status: 'active' | 'upcoming' | 'completed';
  notes?: string;
}

export type NavigationTab = 'events' | 'players' | 'live' | 'scores' | 'settings';

