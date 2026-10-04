import React, { useState, useEffect } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { Search, MapPin, ExternalLink, Check, Navigation, X, Sparkles } from 'lucide-react';
import {
  PHILIPPINES_PICKLEBALL_VENUES,
  PhilippinesVenue,
  findMatchingVenues,
  formatEstablishmentName,
  getGoogleMapsUrl,
} from '../../utils/philippinesVenues';

export interface GoogleMapsCourtSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (locationName: string) => void;
  initialQuery?: string;
}

export const GoogleMapsCourtSearchModal: React.FC<GoogleMapsCourtSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialQuery = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedVenue, setSelectedVenue] = useState<string>(
    initialQuery || 'Pickleball Center BGC'
  );
  const [mapQuery, setMapQuery] = useState<string>(
    initialQuery ? `${initialQuery}, Philippines` : 'Pickleball Center BGC, Taguig, Metro Manila, Philippines'
  );

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialQuery.trim()) {
        const completed = formatEstablishmentName(initialQuery.trim());
        setSearchQuery(completed);
        setSelectedVenue(completed);
        const match = findMatchingVenues(initialQuery.trim())[0];
        setMapQuery(match ? match.googleMapsQuery : `${completed}, Philippines`);
      } else {
        setSearchQuery('');
        setSelectedVenue('Pickleball Center BGC');
        setMapQuery('Pickleball Center BGC, Taguig, Metro Manila, Philippines');
      }
    }
  }, [isOpen, initialQuery]);

  // Smart filtered venues using directory + aliases
  const filteredVenues = findMatchingVenues(searchQuery);

  // Computed full establishment name from query
  const completedEstablishmentName = formatEstablishmentName(searchQuery);

  // When user clicks Select or taps a court, complete the top bar with full venue name!
  const handleSelectVenue = (venue: PhilippinesVenue) => {
    setSelectedVenue(venue.name);
    setSearchQuery(venue.name); // Completes the establishment name in top search bar!
    setMapQuery(venue.googleMapsQuery);
  };

  const handleSelectCustomQuery = () => {
    const completed = formatEstablishmentName(searchQuery);
    setSelectedVenue(completed);
    setSearchQuery(completed); // Completes the establishment name in top search bar!
    setMapQuery(`${completed}, Philippines`);
  };

  const handleCustomQuerySearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    // Check if there is a match in known venues to autocomplete
    const matches = findMatchingVenues(q);
    if (matches.length > 0) {
      handleSelectVenue(matches[0]);
    } else {
      const completed = formatEstablishmentName(q);
      setSelectedVenue(completed);
      setSearchQuery(completed);
      setMapQuery(`${completed} pickleball court, Philippines`);
    }
  };

  const handleConfirm = () => {
    if (selectedVenue.trim()) {
      onSelectLocation(selectedVenue.trim());
      onClose();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Search Pickleball Courts on Google Maps"
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-neutral-500 hidden sm:inline">Selected:</span>
            <span className="text-sm font-black text-neutral-900 dark:text-white truncate">
              {selectedVenue || 'No venue selected'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Check className="w-4 h-4" />}
              onClick={handleConfirm}
              disabled={!selectedVenue.trim()}
            >
              Set as Location
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleCustomQuerySearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (val.trim().length > 2) {
                  setSelectedVenue(val.trim());
                  const match = PHILIPPINES_PICKLEBALL_VENUES.find((v) =>
                    v.name.toLowerCase().includes(val.trim().toLowerCase())
                  );
                  setMapQuery(match ? match.googleMapsQuery : `${val.trim()} pickleball court, Philippines`);
                }
              }}
              placeholder="Search court name, city, or area (e.g. Nomad's, BGC, Pasig, Gameville...)"
              className="w-full pl-11 pr-10 py-3 min-h-[48px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium text-sm sm:text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            variant="secondary"
            size="md"
            icon={<Navigation className="w-4 h-4" />}
            className="shrink-0"
          >
            Find
          </Button>
        </form>

        {/* Real-time Establishment Autocomplete Hint */}
        {searchQuery.trim() && completedEstablishmentName && completedEstablishmentName.toLowerCase() !== searchQuery.trim().toLowerCase() && (
          <div className="flex items-center gap-2 text-xs flex-wrap bg-emerald-50/80 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
            <span className="text-neutral-600 dark:text-neutral-400 font-medium">
              Establishment from map pin:
            </span>
            <button
              type="button"
              onClick={() => {
                const match = findMatchingVenues(completedEstablishmentName)[0];
                if (match) {
                  handleSelectVenue(match);
                } else {
                  handleSelectCustomQuery();
                }
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-emerald-200" />
              <span>{completedEstablishmentName}</span>
              <span className="text-[10px] opacity-80">(Auto-fill)</span>
            </button>
          </div>
        )}

        {/* Google Map Preview & Court Results Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Live Google Map Embed */}
          <div className="lg:col-span-7 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Google Maps Preview
              </span>
              <a
                href={getGoogleMapsUrl(selectedVenue || mapQuery)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold inline-flex items-center gap-1"
              >
                Open in Google Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative w-full h-[240px] sm:h-[280px] rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 shadow-inner">
              <iframe
                title="Google Maps Venue Preview"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  mapQuery
                )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>
            <p className="text-[11px] text-neutral-500">
              Interactive Google Maps view. Zoom and pan freely to view the court location.
            </p>
          </div>

          {/* Court Search Results */}
          <div className="lg:col-span-5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-600 dark:text-neutral-400">
                Philippine Courts ({filteredVenues.length})
              </span>
              <span className="text-neutral-400">Click Select to complete name</span>
            </div>

            <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
              {filteredVenues.map((venue) => {
                const isSelected = selectedVenue === venue.name;
                return (
                  <div
                    key={venue.name}
                    onClick={() => handleSelectVenue(venue)}
                    className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs ring-1 ring-emerald-500/20'
                        : 'bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 hover:border-emerald-400'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-bold truncate ${
                          isSelected
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-neutral-900 dark:text-white'
                        }`}
                      >
                        {venue.name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                        {venue.area}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectVenue(venue);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-neutral-100 hover:bg-emerald-600 hover:text-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Selected
                        </>
                      ) : (
                        'Select'
                      )}
                    </button>
                  </div>
                );
              })}

              {/* Option to use custom or completed establishment */}
              {searchQuery.trim() &&
                !filteredVenues.some(
                  (v) => v.name.toLowerCase() === completedEstablishmentName.toLowerCase()
                ) && (
                  <div
                    onClick={handleSelectCustomQuery}
                    className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 mt-2 ${
                      selectedVenue === completedEstablishmentName
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs ring-1 ring-emerald-500/20'
                        : 'bg-white dark:bg-neutral-800 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-400'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
                        <Sparkles className="w-3 h-3" />
                        <span>Establishment from Map Pin</span>
                      </div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                        "{completedEstablishmentName}"
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">Click Select to complete name</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCustomQuery();
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-neutral-100 hover:bg-emerald-600 hover:text-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors shrink-0 cursor-pointer"
                    >
                      Select
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

