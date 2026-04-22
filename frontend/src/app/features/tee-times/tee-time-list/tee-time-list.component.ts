import {ChangeDetectorRef, Component, DestroyRef, inject, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TagModule} from 'primeng/tag';
import {ButtonModule} from 'primeng/button';
import {DatePickerModule} from 'primeng/datepicker';
import {SkeletonModule} from 'primeng/skeleton';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Course, TeeTime, TeeTimeSearchParams} from '../../../shared/models/models';
import {TeeTimeService} from '../../../core/services/teetime.service';
import {DataSharingService} from '../../../core/services/data-sharing.service';
import {ReservationDialogService} from '../../booking/reservation-dialog.service';
import {FilterTeeTimePipe} from '../../../shared/pipes/filter-tee-time.pipe';
import {FilterCoursePipe} from '../../../shared/pipes/filter-course.pipe';
import {AddressInputComponent} from '../../../shared/components/address-input/address-input.component';
import {LaunchDarklyService} from '../../../core/services/launchdarkly.service';
import {formatDate, formatTeeOff, randomDelay} from '../../../shared/utils';

interface TimePreset {
  label: string;
  value: string;
  start: string;
  end: string;
}

@Component({
  selector: 'app-tee-time-list',
  templateUrl: './tee-time-list.component.html',
  styleUrls: ['./tee-time-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TagModule,
    ButtonModule,
    DatePickerModule,
    FilterTeeTimePipe,
    FilterCoursePipe,
    AddressInputComponent,
    SkeletonModule,
  ],
})
export class TeeTimeListComponent implements OnInit {
  courses: Course[] = [];
  teeTimes: TeeTime[] = [];
  courseStartMap = new Map<number, boolean>();
  readonly skeletonCards = Array(5);
  readonly skeletonTiles = Array(8);
  providers = ['teesnap', 'foreup'];
  loading = true;
  error = false;
  enableBooking = false;
  mapsDistanceEnabled = false;
  selectedAddress?: string;
  searchParams: TeeTimeSearchParams;
  selectedDate: Date;
  activePreset = 'all';

  readonly timePresets: TimePreset[] = [
    {label: 'Morning', value: 'morning', start: '05:00', end: '12:00'},
    {label: 'Afternoon', value: 'afternoon', start: '12:00', end: '18:00'},
    {label: 'All Day', value: 'all', start: '05:00', end: '23:59'},
  ];

  readonly minDate = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  readonly maxDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  })();

  private readonly destroyRef = inject(DestroyRef);
  formatTeeOff = formatTeeOff;

  constructor(
    private teeTimeService: TeeTimeService,
    private dataSharingService: DataSharingService,
    public reservationDialogService: ReservationDialogService,
    private router: Router,
    private cdk: ChangeDetectorRef,
    private ld: LaunchDarklyService,
  ) {
    const saved = this.dataSharingService.getSearchState();
    const [y, m, d] = saved.date.split('-').map(Number);
    this.selectedDate = new Date(y, m - 1, d);

    const preset = this.timePresets.find(p => p.value === saved.preset) ?? this.timePresets[2];
    this.activePreset = preset.value;

    this.searchParams = {
      date: saved.date,
      startTime: preset.start,
      endTime: preset.end,
      holes: saved.holes,
    };
  }

  // ── Date navigation ───────────────────────────────────────────────────────

  ngOnInit(): void {
    this.selectedAddress = localStorage.getItem('selectedAddress') || '';
    this.dataSharingService.setUserLocation(this.selectedAddress);
    this.enableBooking = this.ld.variation('enable-booking', false);
    this.mapsDistanceEnabled = this.ld.variation('maps-distance-enabled', false);
    this.loadCourses();
    this.loadTeeTimes();
  }

  onDateSelect(date: Date): void {
    if (!date) return;
    this.selectedDate = date;
    this.searchParams = {...this.searchParams, date: formatDate(date)};
    this.loadTeeTimes();
    this.saveState();
  }

  changeDate(delta: number): void {
    const next = new Date(this.selectedDate);
    next.setDate(next.getDate() + delta);
    if (next < this.minDate || next > this.maxDate) return;
    this.onDateSelect(next);
  }

  canGoPrev(): boolean {
    const prev = new Date(this.selectedDate);
    prev.setDate(prev.getDate() - 1);
    prev.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return prev >= today;
  }

  // ── Filter controls ───────────────────────────────────────────────────────

  canGoNext(): boolean {
    const next = new Date(this.selectedDate);
    next.setDate(next.getDate() + 1);
    return next <= this.maxDate;
  }

  setHoles(holes: number): void {
    this.searchParams = {...this.searchParams, holes};
    this.saveState();
    this.loadTeeTimes();
  }

  setPreset(preset: TimePreset): void {
    this.activePreset = preset.value;
    this.searchParams = {...this.searchParams, startTime: preset.start, endTime: preset.end};
    this.saveState();
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  loadCourses(): void {
    const cached = this.dataSharingService.getCourses();
    if (cached.length > 0) {
      this.applyCourses(cached);
      return;
    }
    this.teeTimeService.getCourses().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: async (coursesData) => {
        await this.applyCourses(coursesData);
        this.dataSharingService.setCourses(this.courses);
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }

  loadTeeTimes(): void {
    this.loading = true;
    this.error = false;
    this.teeTimeService.getAllTeeTimes(this.searchParams).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (teeTimesData) => {
        this.teeTimes = teeTimesData;
        this.buildCourseStartMap();
        this.dataSharingService.setTeeTimes(this.teeTimes);
        setTimeout(() => {
          this.loading = false;
        }, randomDelay());
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  goToCoursePage(url: string): void {
    window.open(url, '_blank');
  }

  goToCourseDetail(courseId: number): void {
    this.dataSharingService.setTeeTimes(this.teeTimes);
    this.dataSharingService.setCourses(this.courses);
    this.router.navigate(['/course', courseId]);
  }

  async onLocationSelected(place: google.maps.places.PlaceResult): Promise<void> {
    this.selectedAddress = place.formatted_address || '';
    this.loadCourses();
    this.cdk.detectChanges();
  }

  clearAddress(): void {
    this.selectedAddress = '';
    this.cdk.detectChanges();
  }

  getCity(address: string): string {
    const parts = address.split(',');
    return parts.length >= 2 ? parts[1].trim() : '';
  }

  private async applyCourses(coursesData: Course[]): Promise<void> {
    if (this.selectedAddress) {
      this.courses = await this.teeTimeService.mapCourseDrivingTime(coursesData, this.selectedAddress);
      this.cdk.detectChanges();
    } else {
      this.courses = coursesData;
    }
  }

  private buildCourseStartMap(): void {
    const startsPerCourse = new Map<number, Set<string>>();
    for (const t of this.teeTimes) {
      const s = t.start?.trim();
      if (!s) continue;
      if (!startsPerCourse.has(t.courseId)) startsPerCourse.set(t.courseId, new Set());
      startsPerCourse.get(t.courseId)!.add(s);
    }
    const map = new Map<number, boolean>();
    startsPerCourse.forEach((starts, courseId) => map.set(courseId, starts.size > 1));
    this.courseStartMap = map;
  }

  private saveState(): void {
    this.dataSharingService.setSearchState({
      date: this.searchParams.date,
      holes: this.searchParams.holes,
      preset: this.activePreset,
      startTime: this.searchParams.startTime,
      endTime: this.searchParams.endTime,
    });
  }
}
