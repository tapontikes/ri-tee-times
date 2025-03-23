import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TeesnapLoginComponent} from './teesnap-login/teesnap-login.component';
import {TeesnapReserveComponent} from './teesnap-reserve/teesnap-reserve.component';
import {SessionGuard} from "../../../guard/session.guard";

const routes: Routes = [
  {path: 'login', component: TeesnapLoginComponent},
  {
    path: 'reserve',
    component: TeesnapReserveComponent,
    canActivate: [SessionGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TeesnapRoutingModule {
}
