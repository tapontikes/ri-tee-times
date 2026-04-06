import {Routes} from '@angular/router';
import {TeeTimeListComponent} from './features/tee-times/tee-time-list/tee-time-list.component';
import {CourseDetailComponent} from './features/tee-times/course-detail/course-detail.component';
import {AdminComponent} from './features/admin/admin.component';

export const appRoutes: Routes = [
  {path: '', component: TeeTimeListComponent},
  {path: 'course/:id', component: CourseDetailComponent, runGuardsAndResolvers: 'always'},
  {path: 'admin', component: AdminComponent},
  {
    path: 'foreup',
    loadChildren: () => import('./features/booking/foreup/foreup.routes').then(m => m.foreupRoutes)
  },
  {
    path: 'teesnap',
    loadChildren: () => import('./features/booking/teesnap/teesnap.routes').then(m => m.teesnapRoutes)
  },
  {path: '**', redirectTo: ''}
];
