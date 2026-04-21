import {Injectable} from '@angular/core';
import {DialogService} from 'primeng/dynamicdialog';
import {Router} from '@angular/router';
import {Course, TeeTime} from '../../shared/models/models';
import {BookWithCourseComponent} from './book-with-course/book-with-course.component';
import {DataSharingService} from '../../core/services/data-sharing.service';
import {SessionService} from '../../core/services/session.service';
import {environment} from '../../../environments/environment';

@Injectable({providedIn: 'root'})
export class ReservationDialogService {

  constructor(
    private dialog: DialogService,
    private router: Router,
    private dataSharingService: DataSharingService,
    private sessionService: SessionService
  ) {
  }

  book(course: Course, teeTime: TeeTime): void {
    switch (course.provider) {
      case 'teesnap':
        environment.enable_booking ? this.bookWithTeesnap(course, teeTime) : this.openBookWithCourseDialog(course, teeTime);
        break;
      case 'foreup':
        environment.enable_booking ? this.bookWithForeup(course, teeTime) : this.openBookWithCourseDialog(course, teeTime);
        break;
      default:
        this.openBookWithCourseDialog(course, teeTime);
    }
  }

  private bookWithTeesnap(course: Course, teeTime: TeeTime): void {
    this.dataSharingService.setSelectedTeeTime(teeTime);
    this.dataSharingService.setSelectedCourse(course);
    this.sessionService.checkSession(course.id, course.provider).subscribe(session =>
      this.router.navigate([session ? '/teesnap/reserve' : '/teesnap/login'])
    );
  }

  private bookWithForeup(course: Course, teeTime: TeeTime): void {
    this.dataSharingService.setSelectedTeeTime(teeTime);
    this.dataSharingService.setSelectedCourse(course);
    this.sessionService.checkSession(course.id, course.provider).subscribe(session =>
      this.router.navigate([session ? '/foreup/reserve' : '/foreup/login'])
    );
  }

  private openBookWithCourseDialog(course: Course, teeTime: TeeTime): void {
    this.dialog.open(BookWithCourseComponent, {
      header: course.name,
      width: '34em',
      closable: true,
      draggable: false,
      data: {course, teeTime}
    });
  }
}
