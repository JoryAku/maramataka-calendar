import { Route } from '@angular/router';
import { MaramatakaPage } from './pages/maramataka/maramataka-page';

export const appRoutes: Route[] = [
  {
    path: 'pages/maramataka',
    component: MaramatakaPage,
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'pages/maramataka',
  },
];
