import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule, Location} from '@angular/common';
import {Router} from '@angular/router';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {Course, CourseProvider, TeeTime} from '../../../shared/models/models';
import {DataSharingService} from '../../../core/services/data-sharing.service';
import {formatTeeOff} from '../../../shared/utils';

@Component({
  selector: 'app-booking-viewer',
  templateUrl: './booking-viewer.component.html',
  styleUrl: './booking-viewer.component.scss',
  standalone: true,
  imports: [CommonModule],
})
export class BookingViewerComponent implements OnInit, OnDestroy {
  course!: Course;
  teeTime!: TeeTime;
  bookingUrl!: SafeResourceUrl;
  iframeLoading = true;
  formatTeeOff = formatTeeOff;

  private loadingTimeout?: ReturnType<typeof setTimeout>;

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
    this.bookingUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.toProxyUrl(this.course.booking_url));
    this.loadingTimeout = setTimeout(() => {
      this.iframeLoading = false;
    }, 10000);
  }

  ngOnDestroy(): void {
    clearTimeout(this.loadingTimeout);
  }

  onIframeLoad(): void {
    clearTimeout(this.loadingTimeout);
    // Keep spinner visible for at least 1.5 s so it doesn't flash away instantly
    this.loadingTimeout = setTimeout(() => {
      this.iframeLoading = false;
    }, 1500);
  }

  private toProxyUrl(bookingUrl: string): string {
    try {
      if (this.course.provider === CourseProvider.teesnap) {
        return this.teesnapReservationUrl(bookingUrl);
      }
      const {host, pathname, search} = new URL(bookingUrl);
      return `/api/proxy/${host}${pathname}${search}`;
    } catch {
      return bookingUrl;
    }
  }

  private teesnapReservationUrl(bookingUrl: string): string {
    const {host} = new URL(bookingUrl);
    const holes = this.teeTime.holes.includes(18) ? 18 : (this.teeTime.holes[0] ?? 18);
    const teeOffSection = (this.teeTime.start ?? '').split(',')[0] || 'FRONT_NINE';
    const params = new URLSearchParams({
      addons: 'on',
      course: String(this.course.request_data?.course ?? ''),
      holes: String(holes),
      players: String(this.teeTime.spots),
      teeOffSection,
      teeTime: this.teeTime.time,
    });
    return `/api/proxy/${host}/reservation?${params.toString()}`;
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
