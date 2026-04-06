import {Routes} from '@angular/router';
import {sessionGuard} from '../../../core/guards/session.guard';

export const teesnapRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./teesnap-login/teesnap-login.component').then(m => m.TeesnapLoginComponent)
  },
  {
    path: 'reserve',
    loadComponent: () => import('./teesnap-reserve/teesnap-reserve.component').then(m => m.TeesnapReserveComponent),
    canActivate: [sessionGuard]
  }
];
