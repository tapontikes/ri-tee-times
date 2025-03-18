import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TeeTimeListComponent} from './components/tee-time-list/tee-time-list.component';
import {AdminComponent} from './components/admin/admin.component';
import {CourseDetailComponent} from "./components/course-detail/course-detail.component";

const routes: Routes = [
  {path: 'teetimes', component: TeeTimeListComponent},
  {path: 'course/:id', component: CourseDetailComponent, runGuardsAndResolvers: 'always'},
  {path: 'admin', component: AdminComponent},
  {path: '**', redirectTo: 'teetimes'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
