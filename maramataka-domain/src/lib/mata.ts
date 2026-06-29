export type MaramatakaVersion = 'mita-te-tai-best';

export type MataMoonWeekId =
  | 'whiro'
  | 'tamatea'
  | 'rakaunui'
  | 'korekore-tangaroa';

export interface MataMoonWeek {
  id: MataMoonWeekId;
  name: string;
  sequence: number;
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
  moonWeek?: MataMoonWeek;
  contentLayers?: MataContentLayer[];
}
