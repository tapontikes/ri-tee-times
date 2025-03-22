// src/app/services/reservation.service.ts
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {Course, TeeTime} from '../model/models';
import {BookWithCourseComponent} from "../components/modal/book-with-course/book-with-course.component";
import {Router} from '@angular/router';
import {DataSharingService} from "./data-sharing.service";

@Injectable({
  providedIn: 'root'
})
export class ReservationDialogService {

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private dataSharingService: DataSharingService
  ) {
  }

  book(course: Course, teeTime: TeeTime) {
    switch (course.provider) {
      case 'teesnap':
        // Use the new two-page flow
        this.navigateToTeesnapLogin(course, teeTime);
        break;
      default:
        this.openBookWithCourseDialog(course, teeTime)
    }
  }

  /**
   * Navigate to the Teesnap login page with tee time data
   */
  private navigateToTeesnapLogin(course: Course, teeTime: TeeTime): void {

    // Store in service
    this.dataSharingService.setSelectedTeeTime(teeTime);
    this.dataSharingService.setSelectedCourse(course);

    // Navigate to login page
    this.router.navigate(['/teesnap/login']);
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
