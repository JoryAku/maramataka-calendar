export interface LocationData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface LocationSummary {
  id: string;
  name: string;
}

export const LOCATIONS: LocationData[] = [
  {
    id: 'wellington',
    name: 'Wellington',
    latitude: -41.2865,
    longitude: 174.7762,
    timezone: 'Pacific/Auckland',
  },
  {
    id: 'auckland',
    name: 'Auckland',
    latitude: -37.0082,
    longitude: 174.6645,
    timezone: 'Pacific/Auckland',
  },
  {
    id: 'christchurch',
    name: 'Christchurch',
    latitude: -43.5321,
    longitude: 172.6362,
    timezone: 'Pacific/Auckland',
  },
  {
    id: 'gisborne',
    name: 'Gisborne',
    latitude: -38.6624,
    longitude: 178.0097,
    timezone: 'Pacific/Auckland',
  },
];

export function findLocationById(id: string): LocationData | undefined {
  return LOCATIONS.find((location) => location.id === id);
}

export function getLocationSummaries(): LocationSummary[] {
  return LOCATIONS.map((location) => ({
    id: location.id,
    name: location.name,
  }));
}

function validateIanaTimezone(timezone: string): void {
  try {
    new Intl.DateTimeFormat('en-NZ', { timeZone: timezone }).format(new Date());
  } catch {
    throw new Error(`Invalid IANA timezone: ${timezone}`);
  }
}

export function validateLocationRegistry(locations: LocationData[] = LOCATIONS): void {
  const ids = new Set<string>();

  for (const location of locations) {
    if (ids.has(location.id)) {
      throw new Error(`Duplicate location ID: ${location.id}`);
    }

    ids.add(location.id);

    if (
      !location.id ||
      !location.name ||
      location.latitude === undefined ||
      location.longitude === undefined ||
      !location.timezone
    ) {
      throw new Error(`Invalid location data: ${JSON.stringify(location)}`);
    }

    validateIanaTimezone(location.timezone);
  }
}

validateLocationRegistry();
