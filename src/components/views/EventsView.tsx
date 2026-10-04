import React, { useState } from 'react';
import { PickleballEvent, Court } from '../../types';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import {
  Calendar,
  MapPin,
  Clock,
  Plus,
  Layers,
  CheckCircle2,
  Edit,
  Trash2,
  Check,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  PHILIPPINES_PICKLEBALL_VENUES,
  getGoogleMapsUrl,
} from '../../utils/philippinesVenues';
import { GoogleMapsCourtSearchModal } from '../ui/GoogleMapsCourtSearchModal';

export interface EventsViewProps {
  events: PickleballEvent[];
  activeEvent: PickleballEvent;
  courts: Court[];
  playerCount: number;
  onCreateEvent: (eventData: Omit<PickleballEvent, 'id'>) => void;
  onUpdateEvent: (event: PickleballEvent) => void;
  onSelectActiveEvent: (event: PickleballEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  activeEvent,
  courts,
  playerCount,
  onCreateEvent,
  onUpdateEvent,
  onSelectActiveEvent,
  onDeleteEvent,
}) => {
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Google Maps court search modal state
  const [isMapsSearchOpen, setIsMapsSearchOpen] = useState(false);
  const [mapsSearchTarget, setMapsSearchTarget] = useState<'create' | 'edit'>('create');

  // Create Form State
  const [createName, setCreateName] = useState('');
  const [createDate, setCreateDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [createStartTime, setCreateStartTime] = useState('09:00');
  const [createLocation, setCreateLocation] = useState('');
  const [createCourts, setCreateCourts] = useState<number>(4);
  const [createNotes, setCreateNotes] = useState('');

  // Edit Form State
  const [editName, setEditName] = useState(activeEvent.name);
  const [editDate, setEditDate] = useState(activeEvent.date);
  const [editStartTime, setEditStartTime] = useState(activeEvent.startTime || '08:30');
  const [editLocation, setEditLocation] = useState(activeEvent.location);
  const [editCourts, setEditCourts] = useState<number>(activeEvent.courtsCount);
  const [editNotes, setEditNotes] = useState(activeEvent.notes || '');

  // Preset court shortcuts for easy mobile/tablet tapping
  const courtPresets = [2, 3, 4, 5, 6, 8, 10];

  const handleOpenEdit = () => {
    setEditName(activeEvent.name);
    setEditDate(activeEvent.date);
    setEditStartTime(activeEvent.startTime || '08:30');
    setEditLocation(activeEvent.location);
    setEditCourts(activeEvent.courtsCount);
    setEditNotes(activeEvent.notes || '');
    setIsEditOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createLocation.trim()) return;

    onCreateEvent({
      name: createName.trim(),
      date: createDate,
      startTime: createStartTime,
      time: `${createStartTime}`,
      location: createLocation.trim(),
      courtsCount: Math.max(1, createCourts),
      status: 'active',
      notes: createNotes.trim() || undefined,
    });

    // Reset form
    setCreateName('');
    setCreateLocation('');
    setCreateCourts(4);
    setCreateNotes('');
    setIsCreateOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editLocation.trim()) return;

    onUpdateEvent({
      ...activeEvent,
      name: editName.trim(),
      date: editDate,
      startTime: editStartTime,
      time: `${editStartTime}`,
      location: editLocation.trim(),
      courtsCount: Math.max(1, editCourts),
      notes: editNotes.trim() || undefined,
    });

    setIsEditOpen(false);
  };

  const handleSelectCourtFromMaps = (locationName: string) => {
    if (mapsSearchTarget === 'create') {
      setCreateLocation(locationName);
    } else {
      setEditLocation(locationName);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingEventId && onDeleteEvent) {
      onDeleteEvent(deletingEventId);
      setDeletingEventId(null);
    }
  };

  const eventToDelete = events.find((e) => e.id === deletingEventId);

  // Format readable time display
  const formatTimeDisplay = (timeStr?: string) => {
    if (!timeStr) return '';
    if (timeStr.includes(':')) {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${m} ${ampm}`;
    }
    return timeStr;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950 dark:text-white">
            Events & Sessions
          </h1>
          <p className="mt-1 text-base sm:text-lg text-neutral-600 dark:text-neutral-400">
            Create and organize open-play sessions with flexible court setups
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setIsCreateOpen(true)}
        >
          Create Event
        </Button>
      </div>

      {/* Active Event Banner Card */}
      <div className="rounded-2xl border-2 border-emerald-500/50 bg-white dark:bg-neutral-900 p-4 sm:p-6 lg:p-7 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Active Session
          </span>
          <span className="text-xs font-semibold text-neutral-400">
            ID: {activeEvent.id}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-950 dark:text-white tracking-tight leading-snug">
          {activeEvent.name}
        </h2>

        {activeEvent.notes && (
          <p className="mt-1.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
            {activeEvent.notes}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
          {/* Date & Time */}
          <div className="flex items-center gap-3.5 text-neutral-700 dark:text-neutral-300">
            <div className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Date & Start Time</p>
              <p className="text-base font-bold text-neutral-900 dark:text-white">
                {formatTimeDisplay(activeEvent.startTime || activeEvent.time || '08:30')} (3hrs)
              </p>
              <p className="text-xs text-neutral-500 font-medium">
                {activeEvent.date}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3.5 text-neutral-700 dark:text-neutral-300">
            <div className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Location</p>
              <a
                href={getGoogleMapsUrl(activeEvent.location)}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 text-base font-bold text-neutral-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                title="Open venue in Google Maps"
              >
                <span className="truncate">{activeEvent.location}</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0" />
              </a>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Open in Google Maps ↗
              </p>
            </div>
          </div>

          {/* Courts & Players */}
          <div className="flex items-center gap-3.5 text-neutral-700 dark:text-neutral-300">
            <div className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Courts & Players</p>
              <p className="text-base font-bold text-neutral-900 dark:text-white tabular-nums">
                {playerCount} {playerCount === 1 ? 'Player' : 'Players'}
              </p>
              <p className="text-xs text-neutral-500 font-medium">
                {activeEvent.courtsCount} {activeEvent.courtsCount === 1 ? 'Court' : 'Courts'} ({activeEvent.courtsCount * 4} on-court spots)
              </p>
            </div>
          </div>
        </div>

        {/* Action triggers */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={<Edit className="w-4 h-4" />}
            onClick={handleOpenEdit}
          >
            Edit Session & Courts
          </Button>
        </div>
      </div>

      {/* Courts Overview for Active Event */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-base sm:text-lg font-black text-neutral-950 dark:text-white flex items-center gap-2 whitespace-nowrap shrink-0 leading-none">
            <Layers className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Active Courts ({courts.length})</span>
          </h3>
          <span className="text-[11px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
            Flexible Court Layout
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {courts.map((court) => (
            <div
              key={court.id}
              className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 flex flex-col justify-between"
            >
              <div>
                <span className="font-black text-lg text-neutral-900 dark:text-white block">
                  {court.name}
                </span>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Available 2v2
                </span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 self-start mt-3">
                Court #{court.courtNumber}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* All Events List */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-black text-neutral-950 dark:text-white">
              All Saved Events
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              {events.length}
            </span>
          </div>
          <span className="text-xs font-medium text-neutral-500">
            Tap an event to activate
          </span>
        </div>

        <div className="space-y-3">
          {events.map((ev) => {
            const isActive = ev.id === activeEvent.id;
            return (
              <div
                key={ev.id}
                className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg font-bold text-neutral-950 dark:text-white">
                      {ev.name}
                    </span>
                    {isActive && (
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-emerald-600 text-white">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 flex-wrap font-medium">
                    <span>{ev.date}</span>
                    <span>·</span>
                    <span>{formatTimeDisplay(ev.startTime || ev.time)}</span>
                    <span>·</span>
                    <a
                      href={getGoogleMapsUrl(ev.location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-emerald-600 dark:hover:text-emerald-400 underline decoration-neutral-300 dark:decoration-neutral-700 inline-flex items-center gap-1 font-semibold"
                      title="Open in Google Maps"
                    >
                      <span>{ev.location}</span>
                      <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0" />
                    </a>
                    <span>·</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {ev.courtsCount} {ev.courtsCount === 1 ? 'Court' : 'Courts'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!isActive && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onSelectActiveEvent(ev)}
                    >
                      Set Active
                    </Button>
                  )}
                  {events.length > 1 && onDeleteEvent && (
                    <button
                      type="button"
                      onClick={() => setDeletingEventId(ev.id)}
                      title="Delete event"
                      className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Event Dialog */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Event"
        description="Configure an open-play session with any number of courts."
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateSubmit}>
              Create & Set Active
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Event Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Wednesday Evening Open Play"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={createDate}
                onChange={(e) => setCreateDate(e.target.value)}
                className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={createStartTime}
                onChange={(e) => setCreateStartTime(e.target.value)}
                className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Location / Venue *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="e.g. Pickleball Center BGC"
                value={createLocation}
                onChange={(e) => setCreateLocation(e.target.value)}
                className="flex-1 px-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <Button
                type="button"
                variant="outline"
                size="md"
                icon={<MapPin className="w-4 h-4 text-emerald-600" />}
                onClick={() => {
                  setMapsSearchTarget('create');
                  setIsMapsSearchOpen(true);
                }}
                className="shrink-0 whitespace-nowrap"
              >
                Search on Maps
              </Button>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Type custom venue or search on Google Maps to find and set exact courts
            </p>
          </div>

          {/* Flexible Number of Courts */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300">
                Number of Courts * (Flexible)
              </label>
              <span className="text-xs text-neutral-500">
                Any number: 2, 3, 4, 5, 10, etc.
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 mb-2.5">
              {courtPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCreateCourts(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    createCourts === preset
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {preset} Courts
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCreateCourts(Math.max(1, createCourts - 1))}
                className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-800 font-bold text-xl flex items-center justify-center cursor-pointer hover:bg-neutral-300"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={createCourts}
                onChange={(e) => setCreateCourts(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 text-center px-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-black text-xl tabular-nums focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCreateCourts(createCourts + 1)}
                className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-800 font-bold text-xl flex items-center justify-center cursor-pointer hover:bg-neutral-300"
              >
                +
              </button>
              <span className="text-sm font-semibold text-neutral-500">
                ({createCourts * 4} simultaneous player capacity)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Organizer Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Balls provided at court 1. Rest intervals are 15 minutes."
              value={createNotes}
              onChange={(e) => setCreateNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </form>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Active Session"
        description="Update session details or modify court availability."
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditSubmit}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Event Name *
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Location / Venue *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="e.g. The Upper Deck"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="flex-1 px-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <Button
                type="button"
                variant="outline"
                size="md"
                icon={<MapPin className="w-4 h-4 text-emerald-600" />}
                onClick={() => {
                  setMapsSearchTarget('edit');
                  setIsMapsSearchOpen(true);
                }}
                className="shrink-0 whitespace-nowrap"
              >
                Search on Maps
              </Button>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Type custom venue or search on Google Maps to find and set exact courts
            </p>
          </div>

          {/* Edit Court Count */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300">
                Number of Courts (Flexible)
              </label>
              <span className="text-xs text-neutral-500">
                Changing court count updates the live courts
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-2.5">
              {courtPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setEditCourts(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    editCourts === preset
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {preset} Courts
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditCourts(Math.max(1, editCourts - 1))}
                className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-800 font-bold text-xl flex items-center justify-center cursor-pointer hover:bg-neutral-300"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={editCourts}
                onChange={(e) => setEditCourts(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 text-center px-4 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-black text-xl tabular-nums focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setEditCourts(editCourts + 1)}
                className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-800 font-bold text-xl flex items-center justify-center cursor-pointer hover:bg-neutral-300"
              >
                +
              </button>
              <span className="text-sm font-semibold text-neutral-500">
                ({editCourts * 4} simultaneous player capacity)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Organizer Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </form>
      </Dialog>

      {/* Delete Event Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(deletingEventId)}
        onClose={() => setDeletingEventId(null)}
        title="Delete Saved Event"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setDeletingEventId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleConfirmDelete}
            >
              Yes, Delete Event
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5">
          <p className="text-base text-neutral-800 dark:text-neutral-200 font-medium">
            Are you sure you want to delete this event?
          </p>

          {eventToDelete && (
            <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <p className="font-black text-neutral-900 dark:text-white text-base">
                {eventToDelete.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex-wrap">
                <span>{eventToDelete.date}</span>
                <span>·</span>
                <span>{eventToDelete.location}</span>
                <span>·</span>
                <span>{eventToDelete.courtsCount} {eventToDelete.courtsCount === 1 ? 'Court' : 'Courts'}</span>
              </div>
            </div>
          )}

          {eventToDelete?.id === activeEvent.id && (
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800">
              Note: This is your currently active session. Deleting it will switch your active session to another saved event.
            </p>
          )}

          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
            This will permanently remove the event and all associated match history. This action cannot be undone.
          </p>
        </div>
      </Dialog>

      {/* Google Maps Court Search Modal */}
      <GoogleMapsCourtSearchModal
        isOpen={isMapsSearchOpen}
        onClose={() => setIsMapsSearchOpen(false)}
        onSelectLocation={handleSelectCourtFromMaps}
        initialQuery={mapsSearchTarget === 'create' ? createLocation : editLocation}
      />
    </div>
  );
};
