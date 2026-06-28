import {
  LOCATIONS,
  LocationData,
  LocationSummary,
  findLocationById,
  getLocationSummaries,
  validateLocationRegistry,
} from './location';

describe('locations', () => {
  describe('LOCATIONS registry', () => {
    it('contains supported MVP locations', () => {
      expect(LOCATIONS).toHaveLength(4);
      expect(LOCATIONS).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'wellington',
            name: 'Wellington',
            timezone: 'Pacific/Auckland',
            rohe: 'Te Whanganui-a-Tara',
          }),
          expect.objectContaining({
            id: 'auckland',
            name: 'Auckland',
            timezone: 'Pacific/Auckland',
            rohe: 'Tamaki Makaurau',
          }),
          expect.objectContaining({
            id: 'christchurch',
            name: 'Christchurch',
            timezone: 'Pacific/Auckland',
            rohe: 'Otautahi',
          }),
          expect.objectContaining({
            id: 'gisborne',
            name: 'Gisborne',
            timezone: 'Pacific/Auckland',
            rohe: 'Turanganui-a-Kiwa',
          }),
        ]),
      );
    });

    it('has no duplicate IDs', () => {
      const ids = LOCATIONS.map((location) => location.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('findLocationById', () => {
    it('returns location for valid ID', () => {
      const location = findLocationById('wellington');

      expect(location).toEqual(
        expect.objectContaining({
          id: 'wellington',
          name: 'Wellington',
          latitude: -41.2865,
          longitude: 174.7762,
          timezone: 'Pacific/Auckland',
        }),
      );
    });

    it('returns undefined for unknown or differently cased IDs', () => {
      expect(findLocationById('atlantis')).toBeUndefined();
      expect(findLocationById(null as unknown as string)).toBeUndefined();
      expect(findLocationById('Wellington')).toBeUndefined();
    });
  });

  describe('getLocationSummaries', () => {
    it('returns id, name, and extension-ready rohe metadata only', () => {
      const summaries = getLocationSummaries();

      expect(summaries).toHaveLength(4);
      summaries.forEach((summary: LocationSummary) => {
        expect(Object.keys(summary).sort()).toEqual(['id', 'name', 'rohe']);
        expect(summary).not.toHaveProperty('latitude');
        expect(summary).not.toHaveProperty('longitude');
        expect(summary).not.toHaveProperty('timezone');
      });
    });
  });

  describe('validateLocationRegistry', () => {
    it('does not throw for valid registry', () => {
      expect(() => validateLocationRegistry()).not.toThrow();
    });

    it('throws for duplicate location IDs', () => {
      const duplicatedIdLocations: LocationData[] = [
        {
          id: 'wellington',
          name: 'Wellington',
          latitude: -41.2865,
          longitude: 174.7762,
          timezone: 'Pacific/Auckland',
        },
        {
          id: 'wellington',
          name: 'Auckland',
          latitude: -37.0082,
          longitude: 174.6645,
          timezone: 'Pacific/Auckland',
        },
      ];

      expect(() => validateLocationRegistry(duplicatedIdLocations)).toThrow(
        'Duplicate location ID: wellington',
      );
    });

    it('throws for invalid IANA timezone values', () => {
      const invalidTimezoneLocations: LocationData[] = [
        {
          id: 'wellington',
          name: 'Wellington',
          latitude: -41.2865,
          longitude: 174.7762,
          timezone: 'Pacific/NotARealTimezone',
        },
      ];

      expect(() => validateLocationRegistry(invalidTimezoneLocations)).toThrow(
        'Invalid IANA timezone: Pacific/NotARealTimezone',
      );
    });
  });
});
