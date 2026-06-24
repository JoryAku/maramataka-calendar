export interface MaramatakaNight {
  mata: string;
  startsAt: Date;
  endsAt: Date;
}

export interface MaramatakaMonth {
  version: string;
  whiroStartsAt: Date;
  nights: MaramatakaNight[];
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
