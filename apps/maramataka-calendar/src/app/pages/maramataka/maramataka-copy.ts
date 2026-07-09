export type AppLanguage = 'en' | 'mi';

export interface MaramatakaCopy {
  appTitle: string;
  languages: Record<AppLanguage, string>;
  controls: {
    language: string;
    location: string;
    viewDate: string;
    useToday: string;
    loadingLocations: string;
  };
  errors: {
    selectedLocation: string;
    month: string;
    cycle: string;
    today: string;
    moonDetails: string;
    dawnSky: string;
    year: string;
    yearAnnotations: string;
    monthWithoutLocations: string;
    cycleWithoutLocations: string;
    todayWithoutLocations: string;
    moonDetailsWithoutLocations: string;
    yearWithoutLocations: string;
    starMarkersWithoutLocations: string;
    locations: string;
  };
  today: {
    eyebrow: string;
    heading: string;
    loading: string;
    empty: string;
    mataForThisDay: string;
    alsoNextCycle: string;
    untilNextMata: string;
    loadingMoonDetails: string;
    phase: string;
    illumination: string;
    age: string;
    days: string;
    moonTimings: string;
    moonrise: string;
    meridian: string;
    moonset: string;
    nextMoonrise: string;
    loadingDawnSky: string;
    dawnSky: string;
    sampled: string;
    dawnRule: string;
    visible: string;
    dawnHorizon: string;
    noDawnBodies: string;
    moonPhase: string;
    belowHorizonSuffix: string;
    outsideDawnFieldSuffix: string;
    belowHorizon: string;
    above: string;
    bodySingular: string;
    bodyPlural: string;
    visibility: {
      belowHorizon: string;
      low: string;
      visible: string;
      prominent: string;
    };
    markerTypes: {
      asterism: string;
      planet: string;
      skyFigure: string;
      star: string;
    };
  };
  cycle: {
    eyebrow: string;
    heading: string;
    basedOn: string;
    loadingMonth: string;
    emptyMonth: string;
    loadingAnchors: string;
    anchorsUnavailable: string;
    lunarCycle: string;
    rakaunuiObservation: string;
    fullMoon: string;
    nextWhiro: string;
    repeatedMata: string;
    intervalsShown: string;
    finalNamesMayBeOmitted: string;
    starMonth: string;
      namedFrom: string;
      atDawnAroundWhiro: string;
      sequenceNamed: string;
      dawnMarkers: string;
      starMonthRule: string;
      source: string;
      sourceNote: string;
      viewSource: string;
    generatedWheel: string;
    generatedIntervals: string;
    moonrise: string;
    also: string;
    eventsInMata: string;
  };
  year: {
    eyebrow: string;
    heading: string;
    loading: string;
    empty: string;
    ruleNote: string;
    loadingAnnotations: string;
    diagnosticsHeading: string;
    timelineLabel: string;
    levelsLabel: string;
    maramaListLabel: string;
    selectedDate: string;
    selected: string;
    astronomyAnchorsOnly: string;
    mata: string;
    eventTypes: {
      star: string;
      seasonal: string;
      appears: string;
      disappears: string;
      newMoon: string;
      fullMoon: string;
      lunarPhase: string;
      holiday: string;
      solar: string;
      monthStart: string;
    };
  };
}

export const MARAMATAKA_COPY: Record<AppLanguage, MaramatakaCopy> = {
  en: {
    appTitle: 'Maramataka',
    languages: {
      en: 'English',
      mi: 'Te reo Māori',
    },
    controls: {
      language: 'Language',
      location: 'Location',
      viewDate: 'View date',
      useToday: 'Use today',
      loadingLocations: 'Loading locations...',
    },
    errors: {
      selectedLocation: 'Selected location',
      month: 'Unable to load maramataka month. Please try again.',
      cycle: 'Unable to load maramataka cycle anchors.',
      today: 'Unable to load the selected day. Please try again.',
      moonDetails: 'Unable to load moon details.',
      dawnSky: 'Unable to load dawn sky.',
      year: 'Unable to load maramataka year.',
      yearAnnotations: 'Unable to load maramataka year annotations.',
      monthWithoutLocations:
        'Unable to load maramataka month because locations could not be loaded.',
      cycleWithoutLocations:
        'Unable to load maramataka cycle because locations could not be loaded.',
      todayWithoutLocations:
        'Unable to load the selected day because locations could not be loaded.',
      moonDetailsWithoutLocations:
        'Unable to load moon details because locations could not be loaded.',
      yearWithoutLocations:
        'Unable to load maramataka year because locations could not be loaded.',
      starMarkersWithoutLocations:
        'Unable to load star markers because locations could not be loaded.',
      locations: 'Unable to load locations. Please try again.',
    },
    today: {
      eyebrow: '1. Selected day',
      heading: 'What is happening on this day?',
      loading: 'Loading maramataka for the selected day...',
      empty: 'No maramataka night is available for this day.',
      mataForThisDay: 'Mata for this day',
      alsoNextCycle: 'Also {mata} for the next cycle',
      untilNextMata: 'until next mata',
      loadingMoonDetails: 'Loading moon details...',
      phase: 'Phase',
      illumination: 'Illumination',
      age: 'Age',
      days: 'days',
      moonTimings: 'Moon timings',
      moonrise: 'Moonrise',
      meridian: 'Meridian',
      moonset: 'Moonset',
      nextMoonrise: 'Next moonrise',
      loadingDawnSky: 'Loading dawn sky...',
      dawnSky: 'Dawn sky',
      sampled: 'Sampled',
      dawnRule:
        'Dawn is sampled while the Sun is 12° to 18° below the horizon.',
      visible: 'visible',
      dawnHorizon: 'Schematic dawn horizon',
      noDawnBodies:
        'No configured bodies are above the horizon in the sampled dawn sky.',
      moonPhase: 'Moon phase',
      belowHorizonSuffix: 'below the horizon at dawn.',
      outsideDawnFieldSuffix: 'outside the north-to-south dawn field.',
      belowHorizon: 'below horizon',
      above: 'above',
      bodySingular: 'body is',
      bodyPlural: 'bodies are',
      visibility: {
        belowHorizon: 'below horizon',
        low: 'low',
        visible: 'visible',
        prominent: 'prominent',
      },
      markerTypes: {
        asterism: 'asterism',
        planet: 'planet',
        skyFigure: 'sky figure',
        star: 'star',
      },
    },
    cycle: {
      eyebrow: '2. Cycle',
      heading: 'Where am I in this lunar cycle?',
      basedOn: 'Based on',
      loadingMonth: 'Loading maramataka month...',
      emptyMonth: 'No maramataka nights are available for this month.',
      loadingAnchors: 'Loading cycle anchors...',
      anchorsUnavailable:
        'Cycle anchors are unavailable. The generated marama is still shown.',
      lunarCycle: 'Lunar cycle',
      rakaunuiObservation: 'Rakaunui observation',
      fullMoon: 'Full Moon',
      nextWhiro: 'Next Whiro',
      repeatedMata: 'Repeated mata',
      intervalsShown: 'moonrise intervals are shown',
      finalNamesMayBeOmitted: 'final names may be omitted',
      starMonth: 'Star month',
      namedFrom: 'Named from',
      atDawnAroundWhiro: 'at dawn around Whiro',
      sequenceNamed:
        'Named by sequence from the Matariki year start; no specific star marker is configured for this month yet.',
      dawnMarkers: 'Dawn sky markers for this part of the cycle',
      starMonthRule: 'Star month rule',
      source: 'Source',
      sourceNote: 'Source note',
      viewSource: 'View source',
      generatedWheel: 'Generated marama wheel',
      generatedIntervals: 'Generated marama intervals',
      moonrise: 'moonrise',
      also: 'Also',
      eventsInMata: 'Events in this mata',
    },
    year: {
      eyebrow: '3. Year rhythm',
      heading: 'How does the year unfold?',
      loading: 'Loading maramataka year...',
      empty: 'No maramataka year timeline is available for this date.',
      ruleNote:
        'Year view starts at Te Tahi o Pipiri and uses actual dates across the maramataka year. It marks marama boundaries, month and seasonal dawn appearances, Matariki appearance/disappearance, astronomical New Moons, astronomical Full Moons, equinoxes, solstices, and the Matariki public holiday marker.',
      loadingAnnotations: 'Loading celestial annotations...',
      diagnosticsHeading: 'Year timeline notes',
      timelineLabel: 'Maramataka year rhythm timeline',
      levelsLabel: 'Timeline levels',
      maramaListLabel: 'Maramataka months in this year',
      selectedDate: 'Selected date',
      selected: 'Selected',
      astronomyAnchorsOnly: 'Astronomy anchors only',
      mata: 'mata',
      eventTypes: {
        star: 'Star',
        seasonal: 'Seasonal',
        appears: 'Appears',
        disappears: 'Disappears',
        newMoon: 'New Moon',
        fullMoon: 'Full Moon',
        lunarPhase: 'Lunar phase',
        holiday: 'Holiday',
        solar: 'Solar',
        monthStart: 'Month start',
      },
    },
  },
  mi: {
    appTitle: 'Maramataka',
    languages: {
      en: 'English',
      mi: 'Te reo Māori',
    },
    controls: {
      language: 'Reo',
      location: 'Wahi',
      viewDate: 'Ra tirohanga',
      useToday: 'Whakamahia te ra nei',
      loadingLocations: 'E uta ana nga wahi...',
    },
    errors: {
      selectedLocation: 'Wahi kua tipakohia',
      month: 'Kaore i taea te uta i te marama. Whakamatau ano.',
      cycle: 'Kaore i taea te uta i nga pou o te huringa marama.',
      today: 'Kaore i taea te uta i te ra kua tipakohia. Whakamatau ano.',
      moonDetails: 'Kaore i taea te uta i nga korero mo te Marama.',
      dawnSky: 'Kaore i taea te uta i te rangi ata.',
      year: 'Kaore i taea te uta i te tau maramataka.',
      yearAnnotations: 'Kaore i taea te uta i nga tohu o te tau maramataka.',
      monthWithoutLocations:
        'Kaore i taea te uta i te marama no te mea kaore nga wahi i uta.',
      cycleWithoutLocations:
        'Kaore i taea te uta i te huringa marama no te mea kaore nga wahi i uta.',
      todayWithoutLocations:
        'Kaore i taea te uta i te ra kua tipakohia no te mea kaore nga wahi i uta.',
      moonDetailsWithoutLocations:
        'Kaore i taea te uta i nga korero mo te Marama no te mea kaore nga wahi i uta.',
      yearWithoutLocations:
        'Kaore i taea te uta i te tau maramataka no te mea kaore nga wahi i uta.',
      starMarkersWithoutLocations:
        'Kaore i taea te uta i nga tohu whetu no te mea kaore nga wahi i uta.',
      locations: 'Kaore i taea te uta i nga wahi. Whakamatau ano.',
    },
    today: {
      eyebrow: '1. Te ra kua tipakohia',
      heading: 'He aha nga ahuatanga o tenei ra?',
      loading: 'E uta ana te maramataka mo te ra kua tipakohia...',
      empty: 'Kaore he po maramataka mo tenei ra.',
      mataForThisDay: 'Te mata mo tenei ra',
      alsoNextCycle: 'Ara ano ko {mata} mo te huringa whai muri',
      untilNextMata: 'ki te mata whai muri',
      loadingMoonDetails: 'E uta ana nga korero mo te Marama...',
      phase: 'Ahua',
      illumination: 'Maramatanga',
      age: 'Pakeke',
      days: 'ra',
      moonTimings: 'Nga wa o te Marama',
      moonrise: 'Putanga Marama',
      meridian: 'Pou-te-rangi',
      moonset: 'Tōnga Marama',
      nextMoonrise: 'Putanga Marama whai muri',
      loadingDawnSky: 'E uta ana te rangi ata...',
      dawnSky: 'Te rangi ata',
      sampled: 'I inea',
      dawnRule:
        'Ka inea te ata i te wa kei te 12° ki te 18° te Ra i raro i te pae.',
      visible: 'e kitea ana',
      dawnHorizon: 'Tauira pae ata',
      noDawnBodies:
        'Kaore nga tinana kua whirihorahia i runga ake i te pae i te rangi ata kua inea.',
      moonPhase: 'Ahua o te Marama',
      belowHorizonSuffix: 'kei raro i te pae i te ata.',
      outsideDawnFieldSuffix: 'kei waho i te tirohanga ata, raki ki te tonga.',
      belowHorizon: 'kei raro i te pae',
      above: 'kei runga ake i',
      bodySingular: 'tinana',
      bodyPlural: 'tinana',
      visibility: {
        belowHorizon: 'kei raro i te pae',
        low: 'iti',
        visible: 'e kitea ana',
        prominent: 'marama tonu',
      },
      markerTypes: {
        asterism: 'kahui whetu',
        planet: 'aorangi',
        skyFigure: 'tohu rangi',
        star: 'whetu',
      },
    },
    cycle: {
      eyebrow: '2. Huringa',
      heading: 'Kei hea ahau i tenei huringa marama?',
      basedOn: 'I takea mai i',
      loadingMonth: 'E uta ana te marama...',
      emptyMonth: 'Kaore he po maramataka mo tenei marama.',
      loadingAnchors: 'E uta ana nga pou huringa...',
      anchorsUnavailable:
        'Kaore nga pou huringa i te waatea. Ka whakaaturia tonutia te marama kua hangaia.',
      lunarCycle: 'Huringa marama',
      rakaunuiObservation: 'Tirohanga Rakaunui',
      fullMoon: 'Marama Rakaunui',
      nextWhiro: 'Whiro whai muri',
      repeatedMata: 'Mata tuarua',
      intervalsShown: 'nga wa putanga marama e whakaaturia ana',
      finalNamesMayBeOmitted: 'tera pea ka mahue etahi ingoa whakamutunga',
      starMonth: 'Marama whetu',
      namedFrom: 'I tapaina mai i',
      atDawnAroundWhiro: 'i te ata tata ki Whiro',
      sequenceNamed:
        'I tapaina ma te raupapa mai i te timatanga tau o Matariki; kaore ano he tohu whetu motuhake mo tenei marama.',
      dawnMarkers: 'Nga tohu rangi ata mo tenei wahanga o te huringa',
      starMonthRule: 'Ture marama whetu',
      source: 'Puna',
      sourceNote: 'Tuhipoka puna',
      viewSource: 'Tirohia te puna',
      generatedWheel: 'Wira marama kua hangaia',
      generatedIntervals: 'Nga wa marama kua hangaia',
      moonrise: 'putanga marama',
      also: 'Ara ano',
      eventsInMata: 'Nga tohu i tenei mata',
    },
    year: {
      eyebrow: '3. Manawataki tau',
      heading: 'Pehea te takoto o te tau?',
      loading: 'E uta ana te tau maramataka...',
      empty: 'Kaore he ara tau maramataka mo tenei ra.',
      ruleNote:
        'Ka timata te tirohanga tau i Te Tahi o Pipiri, ka whakamahi i nga ra tuturu puta noa i te tau maramataka. Ka tohu i nga rohe marama, nga putanga ata o nga marama me nga kaupeka, te putanga/ngaronga o Matariki, nga Marama Hou arorangi, nga Marama Rakaunui arorangi, nga equinox, nga solstice, me te tohu hararei tumatanui o Matariki.',
      loadingAnnotations: 'E uta ana nga tohu arorangi...',
      diagnosticsHeading: 'Nga tuhipoka ara tau',
      timelineLabel: 'Ara manawataki tau maramataka',
      levelsLabel: 'Nga taumata ara',
      maramaListLabel: 'Nga marama o tenei tau',
      selectedDate: 'Ra kua tipakohia',
      selected: 'Kua tipakohia',
      astronomyAnchorsOnly: 'Nga pou arorangi anake',
      mata: 'mata',
      eventTypes: {
        star: 'Whetu',
        seasonal: 'Kaupeka',
        appears: 'Ka puta',
        disappears: 'Ka ngaro',
        newMoon: 'Marama Hou',
        fullMoon: 'Marama Rakaunui',
        lunarPhase: 'Ahua Marama',
        holiday: 'Hararei',
        solar: 'Ra',
        monthStart: 'Timatanga marama',
      },
    },
  },
};

export function isAppLanguage(value: string): value is AppLanguage {
  return value === 'en' || value === 'mi';
}
