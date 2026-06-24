import { Mata, MaramatakaVersion } from './mata';

export interface MaramatakaNight {
  index: number;
  mata: Mata;
  startsAt: Date;
  endsAt: Date;
}

export interface MaramatakaMonth {
  version: MaramatakaVersion;
  whiroStartsAt: Date;
  nights: MaramatakaNight[];
}