import {Routes} from '@angular/router';
import {sessionGuard} from '../../../core/guards/session.guard';

export const foreupRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./foreup-login/foreup-login.component').then(m => m.ForeupLoginComponent)
  },
  {
    path: 'reserve',
    loadComponent: () => import('./foreup-reserve/foreup-reserve.component').then(m => m.ForeupReserveComponent),
    canActivate: [sessionGuard]
  }
];
