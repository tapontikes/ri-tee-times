import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {DataSharingService} from "../../service/data-sharing.service";
import {ForeupSessionService} from "../../service/foreup/foreup-session.service";


@Injectable({
  providedIn: 'root'
})
export class ForeupSessionGuard implements CanActivate {

  constructor(
    private foreupSessionService: ForeupSessionService,
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
    return this.foreupSessionService.checkSession(course.id).pipe(
      map(session => {
        if (session.isActive) {
          // Session is active, allow navigation
          return true;
        } else {
          // No active session, redirect to login
          this.router.navigate(['/foreup/login']);
          return false;
        }
      }),
      catchError(() => {
        // Error checking session, redirect to login
        this.router.navigate(['/foreup/login']);
        return of(false);
      })
    );
  }
}
