// src/app/services/reservation.service.ts
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {Course, TeeTime} from '../model/models';
import {BookWithCourseComponent} from "../components/main/modal/book-with-course/book-with-course.component";
import {Router} from '@angular/router';
import {DataSharingService} from "./data-sharing.service";
import {SessionService} from "./session.service";

@Injectable({
  providedIn: 'root'
})
export class ReservationDialogService {

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private dataSharingService: DataSharingService,
    private sessionService: SessionService
  ) {
  }

  book(course: Course, teeTime: TeeTime) {
    switch (course.provider) {
      case 'teesnap':
        this.bookWithTeesnap(course, teeTime);
        break;
      case 'foreup':
        this.bookWithForeup(course, teeTime);
        break;
      default:
        this.openBookWithCourseDialog(course, teeTime)
    }
  }

  /**
   * Book with TeesNap using the session-aware flow
   * This will check if there's a valid session and skip the login if possible
   */
  private bookWithTeesnap(course: Course, teeTime: TeeTime): void {
    this.dataSharingService.setSelectedTeeTime(teeTime);
    this.dataSharingService.setSelectedCourse(course);

    this.sessionService.checkSession(course.id, course.provider).subscribe(session => {
      if (session) {
        this.router.navigate(['/teesnap/reserve']);
      } else {
        this.router.navigate(['/teesnap/login']);
      }
    });
  }

  /**
   * Book with ForeUp using the session-aware flow
   * This will check if there's a valid session and skip the login if possible
   */
  private bookWithForeup(course: Course, teeTime: TeeTime): void {
    this.dataSharingService.setSelectedTeeTime(teeTime);
    this.dataSharingService.setSelectedCourse(course);

    this.sessionService.checkSession(course.id, course.provider).subscribe((session) => {
      if (session) {
        this.router.navigate(['/foreup/reserve']);
      } else {
        this.router.navigate(['/foreup/login']);
      }
    });
  }

  private openBookWithCourseDialog(course: Course, teeTime: TeeTime): Observable<any> {
    const dialogRef = this.dialog.open(BookWithCourseComponent, {
      width: '30em',
      maxHeight: '100vh',
      disableClose: true,
      data: {
        course,
        teeTime
      }
    });
    return dialogRef.afterClosed();
  }
}
