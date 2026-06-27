import { Mata, MaramatakaVersion } from './mata';

export interface MaramatakaNight {
  mata: Mata;
  overlappingMata?: MaramatakaNightOverlap[];
  startsAt: Date;
  endsAt: Date;
}

export interface MaramatakaNightOverlap {
  mata: Mata;
  cycleStartsAt: Date;
  reason: 'new-moon-anchor';
}

export interface MaramatakaMonth {
  version: MaramatakaVersion;
  whiroStartsAt: Date;
  nights: MaramatakaNight[];
}
