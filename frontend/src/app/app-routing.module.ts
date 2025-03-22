import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TeeTimeListComponent} from "./components/main/tee-time-list/tee-time-list.component";
import {CourseDetailComponent} from "./components/main/course-detail/course-detail.component";
import {AdminComponent} from "./components/main/admin/admin.component";

const routes: Routes = [
  {path: '', component: TeeTimeListComponent},
  {path: 'course/:id', component: CourseDetailComponent, runGuardsAndResolvers: 'always'},
  {path: 'admin', component: AdminComponent},
  {
    path: 'teesnap',
    loadChildren: () => import('./components/course/teesnap/teesnap.module').then(m => m.TeesnapModule)
  },
  {path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
