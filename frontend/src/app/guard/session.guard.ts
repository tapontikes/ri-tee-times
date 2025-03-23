import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {DataSharingService} from "../service/data-sharing.service";
import {SessionService} from "../service/session.service";


@Injectable({
  providedIn: 'root'
})
export class SessionGuard implements CanActivate {

  constructor(
    private sessionService: SessionService,
    private dataSharingService: DataSharingService,
    private router: Router
  ) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const course = this.dataSharingService.getSelectedCourse();

    if (!course) {
      this.router.navigate(['/']);
      return of(false);
    }

    // Check if session is active for this domain
    return this.sessionService.checkSession(course.id, course.provider).pipe(
      map(session => {
        if (session) {
          return true;
        } else {
          this.router.navigate([`/${course.provider}/login`]);
          return false;
        }
      }),
      catchError(() => {
        this.router.navigate([`/${course.provider}/login`]);
        return of(false);
      })
    );
  }
}
