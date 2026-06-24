import { Provider } from '@nestjs/common';
import { UsnoAstronomyProvider } from '@maramataka-calendar/astronomy';
import { MaramatakaService } from '@maramataka-calendar/maramataka-domain';

export const maramatakaServiceProvider: Provider = {
  provide: MaramatakaService,
  useFactory: () =>
    new MaramatakaService({
      astronomyProvider: new UsnoAstronomyProvider(),
    }),
};
