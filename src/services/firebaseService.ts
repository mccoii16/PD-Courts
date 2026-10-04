import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { PickleballEvent, Player, Match, MatchLineupSwitch } from '../types';

// ==========================================
// 1. EVENTS SERVICE
// ==========================================

export async function saveEventToFirebase(event: PickleballEvent): Promise<void> {
  const path = `events/${event.id}`;
  try {
    await setDoc(doc(db, 'events', event.id), {
      id: event.id,
      name: event.name,
      date: event.date,
      startTime: event.startTime,
      time: event.time || '',
      location: event.location,
      courtsCount: event.courtsCount,
      status: event.status,
      notes: event.notes || '',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEventFromFirebase(eventId: string): Promise<void> {
  const path = `events/${eventId}`;
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToEvents(
  onData: (events: PickleballEvent[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'events';
  try {
    const q = query(collection(db, 'events'));
    return onSnapshot(
      q,
      (snapshot) => {
        const eventsList: PickleballEvent[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          eventsList.push({
            id: data.id || docSnap.id,
            name: data.name || 'Pickleball Event',
            date: data.date || '',
            startTime: data.startTime || '',
            time: data.time || '',
            location: data.location || '',
            courtsCount: typeof data.courtsCount === 'number' ? data.courtsCount : 3,
            status: data.status || 'active',
            notes: data.notes || '',
          });
        });
        onData(eventsList);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// ==========================================
// 2. PLAYERS SERVICE (Master Player Directory)
// ==========================================

export async function savePlayerToFirebase(player: Player): Promise<void> {
  const path = `players/${player.id}`;
  try {
    await setDoc(doc(db, 'players', player.id), {
      id: player.id,
      name: player.name,
      photoUrl: player.photoUrl || '',
      skillLevel: player.skillLevel || null,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePlayerFromFirebase(playerId: string): Promise<void> {
  const path = `players/${playerId}`;
  try {
    await deleteDoc(doc(db, 'players', playerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ==========================================
// 3. EVENT PARTICIPANTS SERVICE
// ==========================================

export async function saveParticipantToFirebase(
  eventId: string,
  participant: Player
): Promise<void> {
  const path = `events/${eventId}/participants/${participant.id}`;
  try {
    await setDoc(doc(db, 'events', eventId, 'participants', participant.id), {
      id: participant.id,
      eventId,
      playerId: participant.id,
      name: participant.name,
      photoUrl: participant.photoUrl || '',
      skillLevel: participant.skillLevel || null,
      status: participant.status,
      isActive: participant.isActive,
      currentCourtId: participant.currentCourtId || null,
      gamesPlayed: participant.gamesPlayed || 0,
      gamesWon: participant.gamesWon || 0,
      gamesLost: participant.gamesLost || 0,
      sittingRounds: participant.sittingRounds || 0,
      consecutiveGames: participant.consecutiveGames || 0,
      partnerIds: participant.partnerIds || [],
      opponentIds: participant.opponentIds || [],
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function batchSaveParticipants(
  eventId: string,
  participants: Player[]
): Promise<void> {
  await Promise.all(participants.map((p) => saveParticipantToFirebase(eventId, p)));
}

export async function deleteParticipantFromFirebase(
  eventId: string,
  participantId: string
): Promise<void> {
  const path = `events/${eventId}/participants/${participantId}`;
  try {
    await deleteDoc(doc(db, 'events', eventId, 'participants', participantId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToEventParticipants(
  eventId: string,
  onData: (participants: Player[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `events/${eventId}/participants`;
  try {
    const q = query(collection(db, 'events', eventId, 'participants'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: Player[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            id: d.id || docSnap.id,
            name: d.name || 'Player',
            photoUrl: d.photoUrl || undefined,
            skillLevel: d.skillLevel || undefined,
            status: d.status || 'available',
            isActive: d.isActive !== false,
            currentCourtId: d.currentCourtId || null,
            gamesPlayed: d.gamesPlayed || 0,
            gamesWon: d.gamesWon || 0,
            gamesLost: d.gamesLost || 0,
            sittingRounds: d.sittingRounds || 0,
            consecutiveGames: d.consecutiveGames || 0,
            partnerIds: d.partnerIds || [],
            opponentIds: d.opponentIds || [],
          });
        });
        onData(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// ==========================================
// 4. MATCHES SERVICE (Live, Staged & Finished)
// ==========================================

export async function saveMatchToFirebase(eventId: string, match: Match): Promise<void> {
  const path = `events/${eventId}/matches/${match.id}`;
  try {
    const cleanPlayer = (p: Player) => ({
      id: p.id,
      name: p.name,
      photoUrl: p.photoUrl || '',
      skillLevel: p.skillLevel || null,
      status: p.status,
      gamesPlayed: p.gamesPlayed || 0,
      gamesWon: p.gamesWon || 0,
      gamesLost: p.gamesLost || 0,
    });

    await setDoc(doc(db, 'events', eventId, 'matches', match.id), {
      id: match.id,
      eventId,
      courtId: match.courtId,
      courtName: match.courtName,
      roundNumber: match.roundNumber || 1,
      matchNumber: match.matchNumber || 1,
      score1: match.score1,
      score2: match.score2,
      status: match.status,
      startedAt: match.startedAt || '',
      completedAt: match.completedAt || '',
      durationMinutes: match.durationMinutes || 18,
      team1Player1: cleanPlayer(match.team1Player1),
      team1Player2: cleanPlayer(match.team1Player2),
      team2Player1: cleanPlayer(match.team2Player1),
      team2Player2: cleanPlayer(match.team2Player2),
      originalPlayers: (match.originalPlayers || [
        match.team1Player1,
        match.team1Player2,
        match.team2Player1,
        match.team2Player2,
      ]).map(cleanPlayer),
      currentPlayers: (match.currentPlayers || [
        match.team1Player1,
        match.team1Player2,
        match.team2Player1,
        match.team2Player2,
      ]).map(cleanPlayer),
      switches: match.switches || [],
      winnerTeam:
        match.score1 > match.score2 ? 1 : match.score2 > match.score1 ? 2 : 'tie',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMatchFromFirebase(eventId: string, matchId: string): Promise<void> {
  const path = `events/${eventId}/matches/${matchId}`;
  try {
    await deleteDoc(doc(db, 'events', eventId, 'matches', matchId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToEventMatches(
  eventId: string,
  onData: (matches: Match[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `events/${eventId}/matches`;
  try {
    const q = query(collection(db, 'events', eventId, 'matches'));
    return onSnapshot(
      q,
      (snapshot) => {
        const matchesList: Match[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          matchesList.push({
            id: d.id || docSnap.id,
            eventId: d.eventId || eventId,
            courtId: d.courtId,
            courtName: d.courtName,
            roundNumber: d.roundNumber || 1,
            matchNumber: d.matchNumber || 1,
            durationMinutes: d.durationMinutes || 18,
            score1: typeof d.score1 === 'number' ? d.score1 : 0,
            score2: typeof d.score2 === 'number' ? d.score2 : 0,
            status: d.status || 'waiting',
            startedAt: d.startedAt || '',
            completedAt: d.completedAt || undefined,
            team1Player1: d.team1Player1,
            team1Player2: d.team1Player2,
            team2Player1: d.team2Player1,
            team2Player2: d.team2Player2,
            originalPlayers: d.originalPlayers,
            currentPlayers: d.currentPlayers,
            switches: d.switches || [],
            winnerTeam: d.winnerTeam,
          });
        });
        onData(matchesList);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// ==========================================
// 5. PLAYER SWITCH HISTORY SERVICE
// ==========================================

export async function recordPlayerSwitchInFirebase(
  eventId: string,
  switchData: MatchLineupSwitch & { id: string; matchId: string }
): Promise<void> {
  const path = `events/${eventId}/switches/${switchData.id}`;
  try {
    await setDoc(doc(db, 'events', eventId, 'switches', switchData.id), {
      ...switchData,
      eventId,
      recordedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToEventSwitches(
  eventId: string,
  onData: (switches: MatchLineupSwitch[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `events/${eventId}/switches`;
  try {
    const q = query(collection(db, 'events', eventId, 'switches'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: MatchLineupSwitch[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as MatchLineupSwitch);
        });
        onData(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}
