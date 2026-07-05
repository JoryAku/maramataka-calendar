export type MaramatakaVersion = 'mita-te-tai-best' | 'living-by-the-star';

export type MataPhaseGroupName =
  | 'Te Marama i te rā'
  | 'Te Hua'
  | 'Tāmatea'
  | 'Te Rākau'
  | 'Te Atarau'
  | 'Korekore'
  | 'Tangaroa';

export interface MataPhaseGroup {
  name: MataPhaseGroupName;
}

export type MataContentLayerStatus = 'available' | 'unavailable';

export interface MataContentLayer {
  id: string;
  name: string;
  source: string;
  sourceUrl?: string;
  version: string;
  status: MataContentLayerStatus;
  description?: string;
  recommendations?: string[];
  unavailableReason?: string;
}

export interface Mata {
  index: number;
  name: string;
  version: MaramatakaVersion;
  phaseGroup?: MataPhaseGroup;
  contentLayers?: MataContentLayer[];
}
