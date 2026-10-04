import React, { useState, useRef } from 'react';
import {
  Player,
  PlayerStatus,
  SkillLevel,
  SKILL_LEVEL_LABELS,
  PLAYER_STATUS_LABELS,
} from '../../types';
import { PlayerRow } from '../ui/PlayerRow';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import {
  Plus,
  Search,
  Users,
  CheckCircle2,
  Ban,
  Upload,
  Image as ImageIcon,
  UserPlus,
  Trash2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export interface PlayersViewProps {
  players: Player[];
  onAddPlayer: (player: Partial<Player>) => void;
  onEditPlayer: (player: Player) => void;
  onRemovePlayer: (playerId: string) => void;
  onTogglePlayerStatus: (player: Player) => void;
  onCheckInAll?: () => void;
  onAddBatchPlayers?: (count: number) => void;
}

export const PlayersView: React.FC<PlayersViewProps> = ({
  players,
  onAddPlayer,
  onEditPlayer,
  onRemovePlayer,
  onTogglePlayerStatus,
  onCheckInAll,
  onAddBatchPlayers,
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PlayerStatus>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');

  // Dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);

  // Form state for Add Player
  const [newName, setNewName] = useState('');
  const [newSkill, setNewSkill] = useState<SkillLevel | ''>('');
  const [newStatus, setNewStatus] = useState<PlayerStatus>('available');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  // Form state for Edit Player
  const [editName, setEditName] = useState('');
  const [editSkill, setEditSkill] = useState<SkillLevel | ''>('');
  const [editStatus, setEditStatus] = useState<PlayerStatus>('available');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Count breakdowns
  const totalCount = players.length;
  const availableCount = players.filter((p) => p.status === 'available').length;
  const playingCount = players.filter((p) => p.status === 'playing').length;
  const waitingCount = players.filter((p) => p.status === 'waiting').length;
  const unavailableCount = players.filter((p) => p.status === 'unavailable').length;

  // Filtered players
  const filteredPlayers = players.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSkill =
      skillFilter === 'all'
        ? true
        : skillFilter === 'unrated'
        ? !p.skillLevel
        : p.skillLevel?.toString() === skillFilter;
    return matchesSearch && matchesStatus && matchesSkill;
  });

  // Handle Photo Upload (Base64 file conversion)
  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setPhotoError('Please choose an image under 2MB.');
        return;
      }
      setPhotoError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddPlayer({
      name: newName.trim(),
      skillLevel: newSkill ? (Number(newSkill) as SkillLevel) : undefined,
      status: newStatus,
      photoUrl: newPhotoUrl.trim() || undefined,
      isActive: newStatus !== 'unavailable',
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      sittingRounds: 0,
      consecutiveGames: 0,
    });

    // Reset form
    setNewName('');
    setNewSkill('');
    setNewStatus('available');
    setNewPhotoUrl('');
    setPhotoError(null);
    setIsAddOpen(false);
  };

  // Open Edit Dialog
  const handleOpenEdit = (player: Player) => {
    setEditingPlayer(player);
    setEditName(player.name);
    setEditSkill(player.skillLevel || '');
    setEditStatus(player.status);
    setEditPhotoUrl(player.photoUrl || '');
    setPhotoError(null);
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer || !editName.trim()) return;

    onEditPlayer({
      ...editingPlayer,
      name: editName.trim(),
      skillLevel: editSkill ? (Number(editSkill) as SkillLevel) : undefined,
      status: editStatus,
      photoUrl: editPhotoUrl.trim() || undefined,
      isActive: editStatus !== 'unavailable',
    });

    setEditingPlayer(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-neutral-950 dark:text-white leading-tight">
              Player Roster
            </h1>
            <span className="px-2.5 py-0.5 rounded-lg text-xs sm:text-sm font-black bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 tabular-nums">
              {totalCount} Total
            </span>
          </div>
          <p className="mt-0.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-medium">
            Check in players, update skill levels, and manage roster availability
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onCheckInAll && unavailableCount > 0 && (
            <Button
              variant="outline"
              size="md"
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              onClick={onCheckInAll}
            >
              Check In All ({unavailableCount})
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddOpen(true)}
            className="min-h-[42px] px-4 py-2 text-xs sm:text-sm font-bold shadow-xs"
          >
            Add Player
          </Button>
        </div>
      </div>

      {/* Quick Status Tabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-neutral-100 dark:bg-neutral-900/60 p-2 rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`py-2.5 px-3 rounded-xl text-sm font-bold flex items-center justify-between transition-colors cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>All Players</span>
          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700">
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('available')}
          className={`py-2.5 px-3 rounded-xl text-sm font-bold flex items-center justify-between transition-colors cursor-pointer ${
            statusFilter === 'available'
              ? 'bg-white dark:bg-neutral-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Available
          </span>
          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            {availableCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('playing')}
          className={`py-2.5 px-3 rounded-xl text-sm font-bold flex items-center justify-between transition-colors cursor-pointer ${
            statusFilter === 'playing'
              ? 'bg-white dark:bg-neutral-800 text-blue-700 dark:text-blue-400 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Playing
          </span>
          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
            {playingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('waiting')}
          className={`py-2.5 px-3 rounded-xl text-sm font-bold flex items-center justify-between transition-colors cursor-pointer ${
            statusFilter === 'waiting'
              ? 'bg-white dark:bg-neutral-800 text-amber-700 dark:text-amber-400 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Waiting
          </span>
          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
            {waitingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('unavailable')}
          className={`col-span-2 sm:col-span-1 py-2.5 px-3 rounded-xl text-sm font-bold flex items-center justify-between transition-colors cursor-pointer ${
            statusFilter === 'unavailable'
              ? 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neutral-400" />
            Unavailable
          </span>
          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
            {unavailableCount}
          </span>
        </button>
      </div>

      {/* Search and Skill Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search players by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Skill Level Filter Select */}
        <div className="shrink-0">
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-bold text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
          >
            <option value="all">All Skill Levels</option>
            <option value="1">1. Beginner (1.0 - 2.0)</option>
            <option value="2">2. Advanced Beginner (2.5)</option>
            <option value="3">3. Low Intermediate (3.0)</option>
            <option value="4">4. High Intermediate (3.5)</option>
            <option value="5">5. Low Advanced (4.0)</option>
            <option value="6">6. High Advanced (4.5+)</option>
            <option value="unrated">Unrated / Casual</option>
          </select>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {(searchTerm || statusFilter !== 'all' || skillFilter !== 'all') && (
        <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400 px-1">
          <span>
            Showing <strong>{filteredPlayers.length}</strong> of {totalCount} players
          </span>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setSkillFilter('all');
            }}
            className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Player List */}
      <div className="space-y-3">
        {filteredPlayers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 p-10 sm:p-14 text-center bg-white/40 dark:bg-neutral-900/40">
            <Users className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
              No players match criteria
            </h3>
            <p className="text-sm text-neutral-500 mt-1 max-w-sm mx-auto">
              Check your search query or status filter, or tap "Add Player" to add a new person to the roster.
            </p>
          </div>
        ) : (
          filteredPlayers.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              courtName={
                player.currentCourtId
                  ? `Court ${player.currentCourtId.replace('c', '')}`
                  : null
              }
              onToggleStatus={onTogglePlayerStatus}
              onEdit={handleOpenEdit}
              onRemove={(p) => setDeletingPlayer(p)}
            />
          ))
        )}
      </div>

      {/* Add Player Dialog */}
      <Dialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Player"
        description="Register a new player for this event. Profile photo and skill level are optional."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddSubmit}>
              Save Player
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Player Full Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Jordan Smith"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Optional Profile Photo */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Profile Photo (Optional)
            </label>
            <div className="flex items-center gap-3">
              {newPhotoUrl ? (
                <div className="relative">
                  <img
                    src={newPhotoUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-xl object-cover border border-neutral-300 dark:border-neutral-700"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPhotoUrl('')}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full text-xs font-bold flex items-center justify-center cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  accept="image/*"
                  ref={addFileInputRef}
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e, setNewPhotoUrl)}
                />
                <button
                  type="button"
                  onClick={() => addFileInputRef.current?.click()}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 cursor-pointer flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Image
                </button>
                <input
                  type="url"
                  placeholder="Or enter image URL..."
                  value={newPhotoUrl.startsWith('data:') ? '' : newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>
            </div>
            {photoError && (
              <p className="mt-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                {photoError}
              </p>
            )}
          </div>

          {/* Optional Skill Level */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Skill Level (Optional)
            </label>
            <select
              value={newSkill}
              onChange={(e) =>
                setNewSkill(e.target.value ? (Number(e.target.value) as SkillLevel) : '')
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

          {/* Initial Status */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Initial Check-in Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as PlayerStatus)}
              className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="available">Available (Checked In & Ready)</option>
              <option value="waiting">Waiting (In Queue / Resting)</option>
              <option value="unavailable">Unavailable (Not checked in yet)</option>
            </select>
          </div>
        </form>
      </Dialog>

      {/* Edit Player Dialog */}
      {editingPlayer && (
        <Dialog
          isOpen={Boolean(editingPlayer)}
          onClose={() => setEditingPlayer(null)}
          title={`Edit Player: ${editingPlayer.name}`}
          description="Update player details, profile photo, skill level, or current status."
          footer={
            <>
              <Button variant="outline" onClick={() => setEditingPlayer(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Player Full Name *
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Profile Photo */}
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Profile Photo (Optional)
              </label>
              <div className="flex items-center gap-3">
                {editPhotoUrl ? (
                  <div className="relative">
                    <img
                      src={editPhotoUrl}
                      alt="Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-neutral-300 dark:border-neutral-700"
                    />
                    <button
                      type="button"
                      onClick={() => setEditPhotoUrl('')}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full text-xs font-bold flex items-center justify-center cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1 space-y-1.5">
                  <input
                    type="file"
                    accept="image/*"
                    ref={editFileInputRef}
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, setEditPhotoUrl)}
                  />
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 cursor-pointer flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Image
                  </button>
                  <input
                    type="url"
                    placeholder="Or enter image URL..."
                    value={editPhotoUrl.startsWith('data:') ? '' : editPhotoUrl}
                    onChange={(e) => setEditPhotoUrl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
              {photoError && (
                <p className="mt-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                  {photoError}
                </p>
              )}
            </div>

            {/* Skill Level */}
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Skill Level
              </label>
              <select
                value={editSkill}
                onChange={(e) =>
                  setEditSkill(e.target.value ? (Number(e.target.value) as SkillLevel) : '')
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

            {/* Status */}
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Player Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as PlayerStatus)}
                className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="available">Available (Checked In & Ready)</option>
                <option value="playing">Playing (Assigned to Court)</option>
                <option value="waiting">Waiting (In Queue / Resting)</option>
                <option value="unavailable">Unavailable (Stepped out / Not present)</option>
              </select>
            </div>

            {/* Stats display in Edit */}
            <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
              <p>
                <strong>Games Record:</strong> {editingPlayer.gamesPlayed} games ({editingPlayer.gamesWon}W – {editingPlayer.gamesLost}L)
              </p>
              <p>
                <strong>Rotation stats:</strong> {editingPlayer.sittingRounds} sitting rounds, {editingPlayer.consecutiveGames} consecutive games
              </p>
            </div>
          </form>
        </Dialog>
      )}

      {/* Remove Player Confirmation Dialog */}
      {deletingPlayer && (
        <Dialog
          isOpen={Boolean(deletingPlayer)}
          onClose={() => setDeletingPlayer(null)}
          title="Remove Player?"
          description={`Are you sure you want to remove "${deletingPlayer.name}" from the roster? This player will be excluded from future matches.`}
          footer={
            <>
              <Button variant="outline" onClick={() => setDeletingPlayer(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => {
                  onRemovePlayer(deletingPlayer.id);
                  setDeletingPlayer(null);
                }}
              >
                Remove Player
              </Button>
            </>
          }
        >
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm text-rose-900 dark:text-rose-200">
              <p className="font-bold">Permanent removal</p>
              <p className="mt-0.5">
                If the player just stepped away temporarily, consider clicking <strong>"Mark Out"</strong> instead of removing them completely.
              </p>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
