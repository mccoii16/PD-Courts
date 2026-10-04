export interface PhilippinesVenue {
  name: string;
  area: string;
  googleMapsQuery: string;
  aliases?: string[];
}

export const PHILIPPINES_PICKLEBALL_VENUES: PhilippinesVenue[] = [
  {
    name: 'ULRAK Pickleball HUB',
    area: 'Bulacao, Cebu South Rd, Cebu City',
    googleMapsQuery: 'ULRAK Pickleball HUB, Cebu South Road, Bulacao, Cebu City, Philippines',
    aliases: ['ulrak', 'ulrak pickleball', 'ulrak hub', 'ulrak cebu', 'bulacao', 'minglanilla', 'cebu pickleball'],
  },
  {
    name: "Nomad's Pickleball",
    area: 'Merville, Parañaque, Metro Manila',
    googleMapsQuery: "Nomads Sports Club, Merville, Parañaque, Metro Manila, Philippines",
    aliases: ['nomad', 'nomads', 'nomad pickleball', 'merville', 'parañaque'],
  },
  {
    name: 'Pickleball Center BGC',
    area: 'Taguig, Metro Manila',
    googleMapsQuery: 'Pickleball Center BGC, Taguig, Metro Manila, Philippines',
    aliases: ['bgc', 'bgc pickleball', 'bonifacio global city', 'taguig'],
  },
  {
    name: 'Ayala Malls The 30th',
    area: 'Pasig, Metro Manila',
    googleMapsQuery: 'Ayala Malls The 30th, Meralco Ave, Pasig, Metro Manila, Philippines',
    aliases: ['ayala 30th', 'the 30th', 'ayala malls', 'meralco ave'],
  },
  {
    name: 'The Upper Deck',
    area: 'Pasig, Metro Manila',
    googleMapsQuery: 'The Upper Deck Sports Center, Pasig, Metro Manila, Philippines',
    aliases: ['upper deck', 'ortigas', 'pasig sports'],
  },
  {
    name: 'Gameville Ball Park',
    area: 'Mandaluyong, Metro Manila',
    googleMapsQuery: 'Gameville Ball Park, Sheridan, Mandaluyong, Metro Manila, Philippines',
    aliases: ['gameville', 'sheridan', 'mandaluyong'],
  },
  {
    name: 'Kerry Sports Manila',
    area: 'BGC, Taguig',
    googleMapsQuery: 'Kerry Sports Manila, Shangri-La The Fort, BGC, Taguig, Philippines',
    aliases: ['kerry sports', 'shangri-la', 'shangrila'],
  },
  {
    name: 'Club Filipino Greenhills',
    area: 'San Juan, Metro Manila',
    googleMapsQuery: 'Club Filipino, Greenhills, San Juan, Metro Manila, Philippines',
    aliases: ['club filipino', 'greenhills', 'san juan'],
  },
  {
    name: 'Alabang Country Club',
    area: 'Muntinlupa, Metro Manila',
    googleMapsQuery: 'Alabang Country Club, Ayala Alabang, Muntinlupa, Philippines',
    aliases: ['alabang', 'ayala alabang', 'muntinlupa'],
  },
  {
    name: 'Valle Verde Country Club',
    area: 'Pasig, Metro Manila',
    googleMapsQuery: 'Valle Verde Country Club, Pasig, Metro Manila, Philippines',
    aliases: ['valle verde', 'vvcc'],
  },
  {
    name: 'The Palms Country Club',
    area: 'Alabang, Muntinlupa',
    googleMapsQuery: 'The Palms Country Club, Filinvest City, Alabang, Philippines',
    aliases: ['the palms', 'filinvest'],
  },
  {
    name: 'Cebu Padel & Pickleball Club',
    area: 'Cebu City',
    googleMapsQuery: 'Cebu Padel and Pickleball Club, Cebu City, Philippines',
    aliases: ['cebu padel', 'cebu pickleball', 'padel cebu'],
  },
  {
    name: 'Metrosports Center Pickleball',
    area: 'Lahug, Cebu City',
    googleMapsQuery: 'Metrosports Center, Salinas Drive, Lahug, Cebu City, Philippines',
    aliases: ['metrosports', 'lahug', 'salinas drive'],
  },
  {
    name: 'SM Seaside Pickleball Courts',
    area: 'SRP, Cebu City',
    googleMapsQuery: 'SM Seaside City Cebu, South Road Properties, Cebu City, Philippines',
    aliases: ['sm seaside', 'seaside cebu', 'srp'],
  },
  {
    name: 'Manila Polo Club',
    area: 'Makati, Metro Manila',
    googleMapsQuery: 'Manila Polo Club, Makati, Metro Manila, Philippines',
    aliases: ['polo club', 'forbes park', 'makati polo'],
  },
  {
    name: 'Makati Sports Club',
    area: 'Salcedo Village, Makati',
    googleMapsQuery: 'Makati Sports Club, Salcedo Village, Makati, Philippines',
    aliases: ['makati sports', 'salcedo'],
  },
  {
    name: 'Quezon City Sports Club',
    area: 'E. Rodriguez, Quezon City',
    googleMapsQuery: 'Quezon City Sports Club, E. Rodriguez, Quezon City, Philippines',
    aliases: ['qc sports', 'e. rodriguez', 'quezon city'],
  },
  {
    name: 'Clark Pickleball Hub',
    area: 'Clark Freeport Zone, Pampanga',
    googleMapsQuery: 'Clark Freeport Zone, Pampanga, Philippines',
    aliases: ['clark', 'pampanga', 'angeles'],
  },
];

/**
 * Smart matching for pickleball venues in the Philippines.
 * Handles fuzzy partial words, aliases, and city searches.
 */
export function findMatchingVenues(searchQuery: string): PhilippinesVenue[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return PHILIPPINES_PICKLEBALL_VENUES;

  // Split query into tokens for flexible matching
  const tokens = query.split(/\s+/).filter(Boolean);

  return PHILIPPINES_PICKLEBALL_VENUES.filter((venue) => {
    const venueNameLower = venue.name.toLowerCase();
    const areaLower = venue.area.toLowerCase();
    const queryLower = venue.googleMapsQuery.toLowerCase();
    const aliases = (venue.aliases || []).map((a) => a.toLowerCase());

    // 1. Direct contains
    if (
      venueNameLower.includes(query) ||
      areaLower.includes(query) ||
      queryLower.includes(query) ||
      aliases.some((alias) => alias.includes(query) || query.includes(alias))
    ) {
      return true;
    }

    // 2. Token match: if all or most tokens match anywhere
    const matchedTokens = tokens.filter(
      (token) =>
        venueNameLower.includes(token) ||
        areaLower.includes(token) ||
        aliases.some((alias) => alias.includes(token))
    );

    return matchedTokens.length > 0;
  });
}

/**
 * Cleanly format custom establishment name from raw user search query.
 * Converts "ulrak pickleball" or "nomad court" to proper title case establishment title.
 */
export function formatEstablishmentName(rawQuery: string): string {
  const clean = rawQuery.trim();
  if (!clean) return '';

  // Check if there is an exact or close venue match in our directory
  const matches = findMatchingVenues(clean);
  if (matches.length > 0) {
    const exact = matches.find(
      (m) =>
        m.name.toLowerCase() === clean.toLowerCase() ||
        (m.aliases && m.aliases.some((a) => a === clean.toLowerCase()))
    );
    if (exact) return exact.name;
    // If the query is a prefix or strong match of the first result
    if (matches[0].name.toLowerCase().includes(clean.toLowerCase()) || clean.toLowerCase().includes(matches[0].name.toLowerCase())) {
      return matches[0].name;
    }
  }

  // Capitalize nicely, preserving well-known acronyms
  const acronyms = new Set(['ULRAK', 'BGC', 'SM', 'QC', 'SRP', 'PBA', 'CC', ' Ayala', 'Filipino', 'Meralco']);
  const words = clean.split(/\s+/);

  return words
    .map((word) => {
      const upper = word.toUpperCase();
      if (acronyms.has(upper)) return upper;
      if (word.toLowerCase() === 'hub') return 'HUB';
      if (word.toLowerCase() === 'the') return 'The';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function getGoogleMapsUrl(locationName: string): string {
  if (!locationName) return 'https://www.google.com/maps';

  const matched = PHILIPPINES_PICKLEBALL_VENUES.find(
    (v) => v.name.toLowerCase() === locationName.trim().toLowerCase()
  );

  const query = matched
    ? matched.googleMapsQuery
    : locationName.toLowerCase().includes('philippines')
    ? locationName
    : `${locationName}, Philippines`;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
