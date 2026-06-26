export interface MaramatakaNight {
  mata: MaramatakaMata;
  startsAt: Date;
  endsAt: Date;
}

export interface LocationSummary {
  id: string;
  name: string;
}

export interface MaramatakaMonth {
  version: string;
  whiroStartsAt: Date;
  nights: MaramatakaNight[];
}

export interface MaramatakaToday<TDate = Date> {
  mata: MaramatakaTodayMata;
  startsAt: TDate;
  endsAt: TDate;
}

export interface MaramatakaMata {
  index: number;
  name: string;
  description: string[];
}

export type MaramatakaTodayMata = MaramatakaMata;

export interface ApiMaramatakaNight {
  mata: ApiMata;
  startsAt: string;
  endsAt: string;
}

export interface ApiMaramatakaToday {
  mata: ApiMata;
  startsAt: string;
  endsAt: string;
}

export interface ApiMata {
  index: number;
  name: string;
  description: string;
  version: string;
}

export interface ApiMaramatakaMonth {
  version: string;
  whiroStartsAt: string;
  nights: ApiMaramatakaNight[];
}
