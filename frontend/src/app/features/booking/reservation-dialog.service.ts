import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Course, TeeTime} from '../../shared/models/models';
import {DataSharingService} from '../../core/services/data-sharing.service';
import {SessionService} from '../../core/services/session.service';
import {LaunchDarklyService} from '../../core/services/launchdarkly.service';
import {BookWithCourseComponent} from "./book-with-course/book-with-course.component";
import {DialogService} from "primeng/dynamicdialog";

@Injectable({providedIn: 'root'})
export class ReservationDialogService {

  constructor(
    private router: Router,
    private dialogService: DialogService,
    private dataSharingService: DataSharingService,
    private sessionService: SessionService,
    private ld: LaunchDarklyService,
  ) {
  }

  book(course: Course, teeTime: TeeTime): void {
    const enableBooking = this.ld.variation('enable-booking', false);
    switch (course.provider) {
      case 'teesnap':
        enableBooking ? this.bookWithTeesnap(course, teeTime) : this.openBookWithCourseDialog(course, teeTime);
        break;
      case 'foreup':
        enableBooking ? this.bookWithForeup(course, teeTime) : this.openBookingViewer(course, teeTime);
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

  private openBookingViewer(course: Course, teeTime: TeeTime): void {
    this.dataSharingService.setSelectedCourse(course);
    this.dataSharingService.setSelectedTeeTime(teeTime);
    this.router.navigate(['/book'], {state: {course, teeTime}});
  }

  private openBookWithCourseDialog(course: Course, teeTime: TeeTime): void {
    this.dialogService.open(BookWithCourseComponent, {
      header: course.name,
      width: '34em',
      closable: true,
      draggable: false,
      data: {course, teeTime}
    });
  }
}
