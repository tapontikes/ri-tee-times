import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {DataSharingService} from "../../service/data-sharing.service";
import {TeesnapSessionService} from "../../service/teesnap/teesnap-session.service";


@Injectable({
  providedIn: 'root'
})
export class TeesnapSessionGuard implements CanActivate {

  constructor(
    private teesnapSessionService: TeesnapSessionService,
    private dataSharingService: DataSharingService,
    private router: Router
  ) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Get the selected course from the data sharing service
    const course = this.dataSharingService.getSelectedCourse();

    if (!course || !course.booking_url) {
      // No course selected, redirect to home
      this.router.navigate(['/']);
      return of(false);
    }

    // Check if session is active for this domain
    return this.teesnapSessionService.checkSession(course.booking_url).pipe(
      map(session => {
        if (session.isActive) {
          // Session is active, allow navigation
          return true;
        } else {
          // No active session, redirect to login
          this.router.navigate(['/teesnap/login']);
          return false;
        }
      }),
      catchError(() => {
        // Error checking session, redirect to login
        this.router.navigate(['/teesnap/login']);
        return of(false);
      })
    );
  }
}
