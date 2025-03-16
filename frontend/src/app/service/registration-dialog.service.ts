// src/app/services/reservation.service.ts
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {Course, TeeTime} from '../model/models';
import {BookWithTeesnapComponent} from "../components/modal/book-with-teesnap/book-with-teesnap.component";
import {BookWithCourseComponent} from "../components/modal/book-with-course/book-with-course.component";

@Injectable({
  providedIn: 'root'
})
export class ReservationDialogService {

  constructor(private dialog: MatDialog) {
  }

  book(course: Course, teeTime: TeeTime) {
    switch (course.provider) {
      case 'teesnap':
        this.bookWithTeesnapDialog(course, teeTime);
        break;
      default:
        this.openBookWithCourseDialog(course, teeTime)
    }
  }


  private bookWithTeesnapDialog(course: Course, teeTime: TeeTime,): Observable<any> {
    const dialogRef = this.dialog.open(BookWithTeesnapComponent, {
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
