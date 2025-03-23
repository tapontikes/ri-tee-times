import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ForeupLoginComponent} from './foreup-login/foreup-login.component';
import {ForeupReserveComponent} from './foreup-reserve/foreup-reserve.component';
import {SessionGuard} from '../../../guard/session.guard';

const routes: Routes = [
  {path: 'login', component: ForeupLoginComponent},
  {
    path: 'reserve',
    component: ForeupReserveComponent,
    canActivate: [SessionGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ForeupRoutingModule {
}
