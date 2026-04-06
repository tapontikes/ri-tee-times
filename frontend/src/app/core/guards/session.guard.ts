import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {DataSharingService} from '../services/data-sharing.service';
import {SessionService} from '../services/session.service';

export const sessionGuard: CanActivateFn = () => {
  const sessionService = inject(SessionService);
  const dataSharingService = inject(DataSharingService);
  const router = inject(Router);

  const course = dataSharingService.getSelectedCourse();
  if (!course) {
    router.navigate(['/']);
    return of(false);
  }

  return sessionService.checkSession(course.id, course.provider).pipe(
    map(session => session ? true : router.createUrlTree([`/${course.provider}/login`])),
    catchError(() => of(router.createUrlTree([`/${course.provider}/login`])))
  );
};
