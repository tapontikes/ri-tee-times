// src/app/app-routing.module.ts

import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TeeTimeListComponent} from './components/tee-time-list/tee-time-list.component';
import {AdminComponent} from './components/admin/admin.component';
import {CourseDetailComponent} from "./components/course-detail/course-detail.component";

const routes: Routes = [
  {path: '', component: TeeTimeListComponent},
  {path: 'course/:id', component: CourseDetailComponent, runGuardsAndResolvers: 'always'},
  {path: 'admin', component: AdminComponent},
  {path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
