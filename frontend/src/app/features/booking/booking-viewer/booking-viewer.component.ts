import {Component, OnInit} from '@angular/core';
import {CommonModule, Location} from '@angular/common';
import {Router} from '@angular/router';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {Course, TeeTime} from '../../../shared/models/models';
import {DataSharingService} from '../../../core/services/data-sharing.service';
import {formatTeeOff} from '../../../shared/utils';

@Component({
  selector: 'app-booking-viewer',
  templateUrl: './booking-viewer.component.html',
  styleUrl: './booking-viewer.component.scss',
  standalone: true,
  imports: [CommonModule],
})
export class BookingViewerComponent implements OnInit {
  course!: Course;
  teeTime!: TeeTime;
  bookingUrl!: SafeResourceUrl;
  formatTeeOff = formatTeeOff;

  constructor(
    private router: Router,
    private location: Location,
    private sanitizer: DomSanitizer,
    private dataSharingService: DataSharingService,
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { course: Course; teeTime: TeeTime } | undefined;
    if (state?.course && state?.teeTime) {
      this.course = state.course;
      this.teeTime = state.teeTime;
    }
  }

  get displayHoles(): number[] {
    return (this.teeTime?.holes ?? []).filter(h => h === 9 || h === 18);
  }

  ngOnInit(): void {
    if (!this.course) {
      this.course = this.dataSharingService.getSelectedCourse();
      this.teeTime = this.dataSharingService.getSelectedTeeTime();
    }
    if (!this.course?.booking_url) {
      this.location.back();
      return;
    }
    this.bookingUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.course.booking_url);
  }

  goBack(): void {
    this.location.back();
  }

  goHome(): void {
    this.router.navigate(['/teetimes']);
  }

  openExternal(): void {
    window.open(this.course.booking_url, '_blank');
  }
}
