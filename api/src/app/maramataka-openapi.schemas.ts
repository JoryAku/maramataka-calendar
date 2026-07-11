const isoDateTime = {
  type: 'string',
  format: 'date-time',
};

const ruleSetSummarySchema = {
  type: 'object',
  required: [
    'id',
    'name',
    'version',
    'mataVersion',
    'metadataVersion',
    'fingerprint',
    'source',
    'tradition',
    'maramaStart',
    'mataBoundary',
    'calibration',
    'balancing',
  ],
  properties: {
    id: { type: 'string', example: 'living-by-the-stars-observational-v1' },
    name: {
      type: 'string',
      example: 'Living by the Stars observational maramataka',
    },
    version: { type: 'string', example: '1' },
    mataVersion: { type: 'string', example: 'living-by-the-star' },
    metadataVersion: { type: 'number', example: 1 },
    fingerprint: { type: 'string', example: 'sha256:abc123' },
    source: {
      type: 'string',
      example: 'Living by the Stars 2021-2024 calendars',
    },
    sourceQuote: { type: 'string' },
    tradition: { type: 'string', example: 'Living by the Stars' },
    maramaStart: { type: 'string' },
    mataBoundary: { type: 'string' },
    calibration: { type: 'string' },
    balancing: { type: 'string' },
  },
};

const mataSchema = {
  type: 'object',
  required: ['index', 'name', 'version'],
  properties: {
    index: { type: 'number', example: 1 },
    name: { type: 'string', example: 'Whiro' },
    version: { type: 'string', example: 'living-by-the-star' },
    phaseGroup: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Te Marama i te rā' },
      },
    },
    contentLayers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          source: { type: 'string' },
          sourceUrl: { type: 'string' },
          version: { type: 'string' },
          status: { type: 'string', enum: ['available', 'unavailable'] },
          description: { type: 'string' },
          recommendations: { type: 'array', items: { type: 'string' } },
          unavailableReason: { type: 'string' },
        },
      },
    },
  },
};

const nightSchema = {
  type: 'object',
  required: ['mata', 'startsAt', 'endsAt'],
  properties: {
    mata: mataSchema,
    overlappingMata: {
      type: 'array',
      items: {
        type: 'object',
        required: ['mata', 'cycleStartsAt', 'reason'],
        properties: {
          mata: mataSchema,
          cycleStartsAt: isoDateTime,
          reason: { type: 'string', enum: ['new-moon-anchor'] },
        },
      },
    },
    startsAt: isoDateTime,
    endsAt: isoDateTime,
  },
};

const cycleAnchorSchema = {
  type: 'object',
  required: [
    'type',
    'label',
    'occursAt',
    'localDate',
    'localTime',
    'timezone',
    'source',
  ],
  properties: {
    type: {
      type: 'string',
      enum: ['whiro', 'full-moon', 'next-whiro'],
      example: 'whiro',
    },
    label: { type: 'string', example: 'Whiro' },
    occursAt: isoDateTime,
    astronomicalOccursAt: isoDateTime,
    localDate: { type: 'string', example: '2026-07-05' },
    localTime: { type: 'string', example: '06:24:00' },
    timezone: { type: 'string', example: 'Pacific/Auckland' },
    source: { type: 'string', example: 'astronomy-engine moonrise' },
    mata: mataSchema,
  },
};

export const starMarkerSchema = {
  type: 'object',
  required: [
    'id',
    'name',
    'type',
    'description',
    'seasonalAssociation',
    'source',
    'confidence',
    'observedAt',
    'altitudeDegrees',
    'azimuthDegrees',
    'direction',
    'visibility',
    'calculation',
  ],
  properties: {
    id: { type: 'string', example: 'matariki' },
    name: { type: 'string', example: 'Matariki' },
    type: {
      type: 'string',
      enum: ['star', 'planet', 'asterism', 'sky-figure'],
    },
    englishName: { type: 'string', example: 'Pleiades' },
    description: { type: 'string' },
    seasonalAssociation: { type: 'string' },
    source: { type: 'string' },
    sourceUrl: { type: 'string' },
    confidence: {
      type: 'string',
      enum: ['confirmed', 'working', 'uncertain'],
    },
    observedAt: isoDateTime,
    altitudeDegrees: { type: 'number', example: 18 },
    azimuthDegrees: { type: 'number', example: 72 },
    direction: { type: 'string', example: 'ENE' },
    visibility: {
      type: 'string',
      enum: ['prominent', 'visible', 'low', 'below-horizon'],
    },
    calculation: { type: 'string' },
  },
};

const dawnSunPathPointSchema = {
  type: 'object',
  required: [
    'observedAt',
    'altitudeDegrees',
    'azimuthDegrees',
    'direction',
  ],
  properties: {
    observedAt: isoDateTime,
    altitudeDegrees: { type: 'number', example: -6 },
    azimuthDegrees: { type: 'number', example: 71 },
    direction: { type: 'string', example: 'E' },
  },
};

const dawnSunPathSchema = {
  type: 'object',
  required: ['startsAt', 'sunriseAt', 'points', 'calculation'],
  properties: {
    startsAt: isoDateTime,
    sunriseAt: isoDateTime,
    points: {
      type: 'array',
      items: dawnSunPathPointSchema,
    },
    calculation: { type: 'string' },
  },
};

const dawnSunriseExtremePointSchema = {
  type: 'object',
  required: [
    'date',
    'observedAt',
    'altitudeDegrees',
    'azimuthDegrees',
    'direction',
  ],
  properties: {
    date: { type: 'string', example: '2026-06-21' },
    observedAt: isoDateTime,
    altitudeDegrees: { type: 'number', example: 0 },
    azimuthDegrees: { type: 'number', example: 58 },
    direction: { type: 'string', example: 'ENE' },
  },
};

const dawnSunriseExtremesSchema = {
  type: 'object',
  required: ['year', 'northernmost', 'southernmost', 'calculation'],
  properties: {
    year: { type: 'number', example: 2026 },
    northernmost: dawnSunriseExtremePointSchema,
    southernmost: dawnSunriseExtremePointSchema,
    calculation: { type: 'string' },
  },
};

const dawnMoonSchema = {
  type: 'object',
  required: [
    'name',
    'type',
    'observedAt',
    'phase',
    'fractionIlluminated',
    'altitudeDegrees',
    'azimuthDegrees',
    'direction',
    'visibility',
    'calculation',
    'source',
  ],
  properties: {
    name: { type: 'string', example: 'Moon' },
    type: { type: 'string', enum: ['moon'] },
    observedAt: isoDateTime,
    phase: { type: 'string', example: 'Waxing Crescent' },
    fractionIlluminated: { type: 'number', example: 0.25 },
    altitudeDegrees: { type: 'number', example: 14 },
    azimuthDegrees: { type: 'number', example: 96 },
    direction: { type: 'string', example: 'E' },
    visibility: {
      type: 'string',
      enum: ['prominent', 'visible', 'low', 'below-horizon'],
    },
    calculation: { type: 'string' },
    source: { type: 'string' },
  },
};

export const dawnSkySchema = {
  type: 'object',
  required: ['starMarkers', 'sunPath'],
  properties: {
    starMarkers: {
      type: 'array',
      items: starMarkerSchema,
    },
    sunPath: dawnSunPathSchema,
    sunriseExtremes: dawnSunriseExtremesSchema,
    moon: dawnMoonSchema,
  },
};

const starMonthSchema = {
  type: 'object',
  required: ['name', 'rule', 'source'],
  properties: {
    name: { type: 'string', example: 'Te Tahi o Pipiri' },
    marker: starMarkerSchema,
    rule: { type: 'string' },
    source: { type: 'string' },
    sourceUrl: { type: 'string' },
    note: {
      type: 'object',
      properties: {
        sequence: { type: 'number' },
        name: { type: 'string' },
        markerIds: { type: 'array', items: { type: 'string' } },
        description: { type: 'string' },
        sourceText: { type: 'string' },
      },
    },
  },
};

const cycleDetailsSchema = {
  type: 'object',
  required: [
    'version',
    'ruleSet',
    'timezone',
    'currentMataIndex',
    'currentNight',
    'anchors',
    'nights',
  ],
  properties: {
    version: { type: 'string', example: 'living-by-the-star' },
    ruleSet: ruleSetSummarySchema,
    timezone: { type: 'string', example: 'Pacific/Auckland' },
    currentMataIndex: { type: 'number', example: 1 },
    currentNight: nightSchema,
    anchors: {
      type: 'object',
      required: ['whiro', 'nextWhiro'],
      properties: {
        whiro: cycleAnchorSchema,
        fullMoon: cycleAnchorSchema,
        nextWhiro: cycleAnchorSchema,
      },
    },
    nights: { type: 'array', items: nightSchema },
    starMonth: starMonthSchema,
    starMarkers: { type: 'array', items: starMarkerSchema },
  },
};

const moonDetailsSchema = {
  type: 'object',
  required: [
    'date',
    'phase',
    'fractionIlluminated',
    'lunarAgeDays',
    'distanceKm',
    'unavailable',
    'source',
  ],
  properties: {
    date: { type: 'string', example: '2026-07-05' },
    phase: { type: 'string', example: 'Waning Gibbous' },
    fractionIlluminated: { type: 'number', example: 0.73 },
    lunarAgeDays: { type: 'number', nullable: true, example: 19.2 },
    distanceKm: { type: 'number', nullable: true, example: null },
    lunarAgeSource: { type: 'string' },
    closestPhase: {
      type: 'object',
      required: ['phase', 'occursAt', 'source'],
      properties: {
        phase: { type: 'string', example: 'Full Moon' },
        occursAt: isoDateTime,
        source: { type: 'string' },
      },
    },
    moonrise: {
      type: 'object',
      required: ['occursAt', 'source'],
      properties: {
        occursAt: isoDateTime,
        source: { type: 'string' },
      },
    },
    moonset: {
      type: 'object',
      required: ['occursAt', 'source'],
      properties: {
        occursAt: isoDateTime,
        source: { type: 'string' },
      },
    },
    transit: {
      type: 'object',
      required: ['occursAt', 'source'],
      properties: {
        occursAt: isoDateTime,
        source: { type: 'string' },
      },
    },
    unavailable: {
      type: 'array',
      items: { type: 'string', enum: ['lunarAgeDays', 'distanceKm'] },
    },
    source: { type: 'string', example: 'astronomy-engine' },
  },
};

export const maramatakaPageResponseSchema = {
  type: 'object',
  required: ['cycle', 'moonDetails'],
  properties: {
    cycle: cycleDetailsSchema,
    moonDetails: moonDetailsSchema,
  },
};

const yearEventSchema = {
  type: 'object',
  required: ['type', 'name', 'occursAt'],
  properties: {
    type: {
      type: 'string',
      enum: [
        'month-start',
        'star-marker',
        'star-appearance',
        'star-invisibility',
        'sunrise-extreme',
        'new-moon',
        'full-moon',
        'public-holiday',
      ],
    },
    name: { type: 'string', example: 'Matariki appears' },
    occursAt: isoDateTime,
    monthSequence: { type: 'number' },
    monthName: { type: 'string' },
    starMarkerScope: { type: 'string', enum: ['month', 'seasonal'] },
    description: { type: 'string' },
    source: { type: 'string' },
  },
};

const yearDiagnosticSchema = {
  type: 'object',
  required: ['type', 'name', 'reason'],
  properties: {
    type: {
      type: 'string',
      enum: ['phase-provider', 'estimated-month', 'skipped-month'],
    },
    name: { type: 'string' },
    sequence: { type: 'number' },
    anchorDate: isoDateTime,
    reason: { type: 'string' },
  },
};

const yearMonthSchema = {
  type: 'object',
  required: [
    'sequence',
    'name',
    'startsAt',
    'endsAt',
    'durationDays',
    'nightsCount',
    'repeatedMata',
    'anchors',
  ],
  properties: {
    sequence: { type: 'number', example: 1 },
    name: { type: 'string', example: 'Te Tahi o Pipiri' },
    starMonth: starMonthSchema,
    starMarkers: { type: 'array', items: starMarkerSchema },
    isEstimated: { type: 'boolean' },
    unavailableReason: { type: 'string' },
    startsAt: isoDateTime,
    endsAt: isoDateTime,
    durationDays: { type: 'number', example: 29 },
    nightsCount: { type: 'number', example: 29 },
    repeatedMata: { type: 'array', items: { type: 'string' } },
    anchors: {
      type: 'object',
      required: ['whiro', 'nextWhiro'],
      properties: {
        whiro: cycleAnchorSchema,
        fullMoon: cycleAnchorSchema,
        nextWhiro: cycleAnchorSchema,
      },
    },
  },
};

export const maramatakaYearResponseSchema = {
  type: 'object',
  required: [
    'version',
    'ruleSet',
    'year',
    'timezone',
    'startsAt',
    'endsAt',
    'months',
    'events',
    'diagnostics',
  ],
  properties: {
    version: { type: 'string', example: 'living-by-the-star' },
    ruleSet: ruleSetSummarySchema,
    year: { type: 'number', example: 2026 },
    timezone: { type: 'string', example: 'Pacific/Auckland' },
    startsAt: isoDateTime,
    endsAt: isoDateTime,
    months: { type: 'array', items: yearMonthSchema },
    events: { type: 'array', items: yearEventSchema },
    diagnostics: { type: 'array', items: yearDiagnosticSchema },
  },
};
