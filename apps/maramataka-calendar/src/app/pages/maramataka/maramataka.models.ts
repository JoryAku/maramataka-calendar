export interface MaramatakaNight {
  mata: string;
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
  mata: ApiMata;
  startsAt: TDate;
  endsAt: TDate;
}

export interface ApiMaramatakaNight {
  mata: string | ApiMata;
  startsAt: string;
  endsAt: string;
}

export interface ApiMata {
  index: number;
  name: string;
  version: string;
}

export interface ApiMaramatakaMonth {
  version: string;
  whiroStartsAt: string;
  nights: ApiMaramatakaNight[];
}
