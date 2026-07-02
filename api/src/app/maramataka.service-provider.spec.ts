import { Location, StarMarkerDefinition } from '@maramataka-calendar/astronomy';
import { StubAstronomyProvider } from './maramataka.service-provider';

describe('StubAstronomyProvider', () => {
  const location: Location = {
    latitude: -41.2865,
    longitude: 174.7762,
    timezone: 'Pacific/Auckland',
  };

  const createMarker = (id: string, name: string): StarMarkerDefinition => ({
    id,
    name,
    type: 'star',
    description: `${name} marker`,
    seasonalAssociation: `${name} season`,
    source: 'test',
    confidence: 'confirmed',
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 1,
      declinationDegrees: 1,
    },
  });

  it('omits first appearances that fall on or after the exclusive end date', async () => {
    const provider = new StubAstronomyProvider();

    const appearances = await provider.getStarFirstAppearances(
      '2026-06-15',
      '2026-07-15',
      location,
      [
        createMarker('first', 'First'),
        createMarker('second', 'Second'),
        createMarker('third', 'Third'),
      ],
    );

    expect(appearances.map((appearance) => appearance.id)).toEqual(['first']);
    expect(
      appearances.every(
        (appearance) => appearance.observedAt < new Date('2026-07-15T00:00:00Z'),
      ),
    ).toBe(true);
  });
});
