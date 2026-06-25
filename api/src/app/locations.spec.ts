import {
  LOCATIONS,
  LocationSummary,
  findLocationById,
  getLocationSummaries,
  validateLocationRegistry,
} from './locations';

describe('locations', () => {
  describe('LOCATIONS registry', () => {
    it('contains all four locations', () => {
      expect(LOCATIONS).toHaveLength(4);
    });

    it('contains Wellington', () => {
      const wellington = LOCATIONS.find((loc) => loc.id === 'wellington');
      expect(wellington).toEqual({
        id: 'wellington',
        name: 'Wellington',
        latitude: -41.2865,
        longitude: 174.7762,
        timezone: 'Pacific/Auckland',
      });
    });

    it('contains Auckland', () => {
      const auckland = LOCATIONS.find((loc) => loc.id === 'auckland');
      expect(auckland).toEqual({
        id: 'auckland',
        name: 'Auckland',
        latitude: -37.0082,
        longitude: 174.6645,
        timezone: 'Pacific/Auckland',
      });
    });

    it('contains Christchurch', () => {
      const christchurch = LOCATIONS.find((loc) => loc.id === 'christchurch');
      expect(christchurch).toEqual({
        id: 'christchurch',
        name: 'Christchurch',
        latitude: -43.5321,
        longitude: 172.6362,
        timezone: 'Pacific/Auckland',
      });
    });

    it('contains Gisborne', () => {
      const gisborne = LOCATIONS.find((loc) => loc.id === 'gisborne');
      expect(gisborne).toEqual({
        id: 'gisborne',
        name: 'Gisborne',
        latitude: -38.6624,
        longitude: 178.0097,
        timezone: 'Pacific/Auckland',
      });
    });

    it('has no duplicate IDs', () => {
      const ids = LOCATIONS.map((loc) => loc.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('findLocationById', () => {
    it('returns location for valid ID', () => {
      const location = findLocationById('wellington');
      expect(location).toBeDefined();
      expect(location?.id).toBe('wellington');
      expect(location?.name).toBe('Wellington');
    });

    it('returns undefined for unknown ID', () => {
      const location = findLocationById('atlantis');
      expect(location).toBeUndefined();
    });

    it('returns undefined for null ID', () => {
      const location = findLocationById(null as unknown as string);
      expect(location).toBeUndefined();
    });

    it('is case-sensitive', () => {
      const location = findLocationById('Wellington');
      expect(location).toBeUndefined();
    });

    it('finds all four locations by ID', () => {
      const ids = ['wellington', 'auckland', 'christchurch', 'gisborne'];
      ids.forEach((id) => {
        const location = findLocationById(id);
        expect(location).toBeDefined();
        expect(location?.id).toBe(id);
      });
    });
  });

  describe('getLocationSummaries', () => {
    it('returns array of summaries', () => {
      const summaries = getLocationSummaries();
      expect(Array.isArray(summaries)).toBe(true);
    });

    it('returns four summaries', () => {
      const summaries = getLocationSummaries();
      expect(summaries).toHaveLength(4);
    });

    it('includes id and name only', () => {
      const summaries = getLocationSummaries();
      summaries.forEach((summary) => {
        expect(Object.keys(summary).sort()).toEqual(['id', 'name']);
      });
    });

    it('does not include sensitive location data', () => {
      const summaries = getLocationSummaries();
      summaries.forEach((summary: LocationSummary) => {
        expect(summary).not.toHaveProperty('latitude');
        expect(summary).not.toHaveProperty('longitude');
        expect(summary).not.toHaveProperty('timezone');
      });
    });

    it('returns correct summaries', () => {
      const summaries = getLocationSummaries();
      expect(summaries).toContainEqual({
        id: 'wellington',
        name: 'Wellington',
      });
      expect(summaries).toContainEqual({
        id: 'auckland',
        name: 'Auckland',
      });
      expect(summaries).toContainEqual({
        id: 'christchurch',
        name: 'Christchurch',
      });
      expect(summaries).toContainEqual({
        id: 'gisborne',
        name: 'Gisborne',
      });
    });
  });

  describe('validateLocationRegistry', () => {
    it('does not throw for valid registry', () => {
      expect(() => validateLocationRegistry()).not.toThrow();
    });
  });
});
