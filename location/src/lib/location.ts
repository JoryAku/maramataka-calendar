export interface LocationData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  rohe?: string;
  aliases?: string[];
}

export interface LocationSummary {
  id: string;
  name: string;
  timezone: string;
  rohe?: string;
}

export const LOCATIONS: LocationData[] = [
  // Representative observing locations. The rohe labels provide local context
  // for users; the coordinates are town/city points, not boundary models.
  {
    id: 'tahiti',
    name: 'Tahiti',
    latitude: -17.5516,
    longitude: -149.5585,
    timezone: 'Pacific/Tahiti',
    rohe: 'French Polynesia',
  },
  {
    id: 'kaitaia',
    name: 'Kaitaia',
    latitude: -35.1149,
    longitude: 173.2621,
    timezone: 'Pacific/Auckland',
    rohe: 'Te Hiku o te Ika',
  },
  {
    id: 'whangarei',
    name: 'Whangārei',
    latitude: -35.7251,
    longitude: 174.3237,
    timezone: 'Pacific/Auckland',
    rohe: 'Te Tai Tokerau',
  },
  {
    id: 'auckland',
    name: 'Auckland',
    latitude: -37.0082,
    longitude: 174.6645,
    timezone: 'Pacific/Auckland',
    rohe: 'Tamaki Makaurau',
  },
  {
    id: 'thames',
    name: 'Thames',
    latitude: -37.1383,
    longitude: 175.5402,
    timezone: 'Pacific/Auckland',
    rohe: 'Hauraki',
  },
  {
    id: 'tauranga',
    name: 'Tauranga',
    latitude: -37.6878,
    longitude: 176.1651,
    timezone: 'Pacific/Auckland',
    rohe: 'Tauranga Moana',
  },
  {
    id: 'hamilton',
    name: 'Hamilton',
    latitude: -37.787,
    longitude: 175.2793,
    timezone: 'Pacific/Auckland',
    rohe: 'Waikato',
  },
  {
    id: 'whakatane',
    name: 'Whakatāne',
    latitude: -37.9534,
    longitude: 176.9908,
    timezone: 'Pacific/Auckland',
    rohe: 'Mataatua',
  },
  {
    id: 'rotorua',
    name: 'Rotorua',
    latitude: -38.1368,
    longitude: 176.2497,
    timezone: 'Pacific/Auckland',
    rohe: 'Te Arawa',
  },
  {
    id: 'gisborne',
    name: 'Gisborne',
    latitude: -38.6624,
    longitude: 178.0097,
    timezone: 'Pacific/Auckland',
    rohe: 'Turanganui-a-Kiwa',
  },
  {
    id: 'new-plymouth',
    name: 'New Plymouth',
    latitude: -39.0556,
    longitude: 174.0752,
    timezone: 'Pacific/Auckland',
    rohe: 'Taranaki',
  },
  {
    id: 'napier',
    name: 'Napier',
    latitude: -39.4928,
    longitude: 176.912,
    timezone: 'Pacific/Auckland',
    rohe: 'Te Matau-a-Māui',
  },
  {
    id: 'whanganui',
    name: 'Whanganui',
    latitude: -39.9301,
    longitude: 175.0479,
    timezone: 'Pacific/Auckland',
    rohe: 'Whanganui',
  },
  {
    id: 'palmerston-north',
    name: 'Palmerston North',
    latitude: -40.3523,
    longitude: 175.6082,
    timezone: 'Pacific/Auckland',
    rohe: 'Manawatū',
  },
  {
    id: 'nelson',
    name: 'Nelson',
    latitude: -41.2706,
    longitude: 173.284,
    timezone: 'Pacific/Auckland',
    rohe: 'Whakatū / Te Tauihu',
  },
  {
    id: 'wellington',
    name: 'Wellington',
    latitude: -41.2865,
    longitude: 174.7762,
    timezone: 'Pacific/Auckland',
    rohe: 'Te Whanganui-a-Tara',
  },
  {
    id: 'greymouth',
    name: 'Greymouth',
    latitude: -42.4504,
    longitude: 171.2108,
    timezone: 'Pacific/Auckland',
    rohe: 'Te Tai Poutini',
  },
  {
    id: 'christchurch',
    name: 'Christchurch',
    latitude: -43.5321,
    longitude: 172.6362,
    timezone: 'Pacific/Auckland',
    rohe: 'Otautahi',
  },
  {
    id: 'waitangi-chatham-islands',
    name: 'Waitangi, Chatham Islands',
    latitude: -43.9535,
    longitude: -176.5597,
    timezone: 'Pacific/Chatham',
    rohe: 'Rēkohu / Wharekauri',
  },
  {
    id: 'dunedin',
    name: 'Dunedin',
    latitude: -45.8788,
    longitude: 170.5028,
    timezone: 'Pacific/Auckland',
    rohe: 'Ōtepoti',
  },
  {
    id: 'invercargill',
    name: 'Invercargill',
    latitude: -46.4132,
    longitude: 168.3538,
    timezone: 'Pacific/Auckland',
    rohe: 'Waihōpai',
  },
];

const LOCATION_SUMMARIES = Object.freeze(
  LOCATIONS.map((location) =>
    Object.freeze({
      id: location.id,
      name: location.name,
      timezone: location.timezone,
      rohe: location.rohe,
    }),
  ),
);

export function findLocationById(id: string): LocationData | undefined {
  return LOCATIONS.find((location) => location.id === id);
}

export function getLocationSummaries(): readonly LocationSummary[] {
  return LOCATION_SUMMARIES;
}

export function validateLocationRegistry(
  locations: LocationData[] = LOCATIONS,
): void {
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

    if (
      location.latitude < -90 ||
      location.latitude > 90 ||
      location.longitude < -180 ||
      location.longitude > 180
    ) {
      throw new Error(`Invalid location coordinates: ${location.id}`);
    }

    validateIanaTimezone(location.timezone);
  }
}

function validateIanaTimezone(timezone: string): void {
  try {
    new Intl.DateTimeFormat('en-NZ', { timeZone: timezone }).format(new Date());
  } catch {
    throw new Error(`Invalid IANA timezone: ${timezone}`);
  }
}

validateLocationRegistry();
