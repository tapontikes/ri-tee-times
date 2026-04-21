import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router} from '@angular/router';
import {CommonModule, formatDate} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {TagModule} from 'primeng/tag';
import {SelectModule} from 'primeng/select';
import {DatePickerModule} from 'primeng/datepicker';
import {FormsModule} from '@angular/forms';
import {SkeletonModule} from 'primeng/skeleton';
import {skip} from 'rxjs/operators';
import {Course, TeeTime, TeeTimeSearchParams} from '../../../shared/models/models';
import {DataSharingService} from '../../../core/services/data-sharing.service';
import {TeeTimeService} from '../../../core/services/teetime.service';
import {ReservationDialogService} from '../../booking/reservation-dialog.service';
import {formatTeeOff, randomDelay} from "../../../shared/utils";

@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, SelectModule, DatePickerModule, FormsModule, SkeletonModule],
})
export class CourseDetailComponent implements OnInit {
  course: Course | undefined;

  courseId = 0;
  allCourses: Course[] = [];
  loading = false;
  teeTimes: TeeTime[] = [];
  filteredTeeTimes: TeeTime[] = [];
  hourGroups: { label: string; teeTimes: TeeTime[] }[] = [];
  readonly skeletonGroups = Array(3);
  error = false;
  readonly skeletonRows = Array(4);
  selectedDate: Date;
  searchParams: TeeTimeSearchParams;
  activeStart: string | null = null;
  hasStartOptions = false;
  minDate = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  maxDate = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 7);
    return d;
  })();
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    public reservationDialogService: ReservationDialogService,
    private dataSharingService: DataSharingService,
    private teeTimeService: TeeTimeService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    // Read initial values synchronously from snapshot — runs before any render
    const snap = this.route.snapshot;
    this.courseId = +snap.params['id'];

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const isAfter5PM = new Date().getHours() >= 17;
    const defaultDate = isAfter5PM ? new Date(now.setDate(now.getDate() + 1)) : now;

    if (snap.queryParams['date']) {
      const [y, m, d] = snap.queryParams['date'].split('-').map(Number);
      this.selectedDate = new Date(y, m - 1, d);
    } else {
      this.selectedDate = defaultDate;
    }

    this.searchParams = {
      date: formatDate(this.selectedDate, 'yyyy-MM-dd', 'en-US'),
      startTime: '06:00',
      endTime: '18:00',
      holes: 10,
    };
  }

  ngOnInit(): void {
    // Load courses for the switcher — use cache or fetch from API
    const cached = this.dataSharingService.getCourses();
    if (cached.length > 0) {
      this.allCourses = cached;
      this.resolveCourse();
    } else {
      this.teeTimeService.getCourses().pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(courses => {
        this.allCourses = courses;
        this.dataSharingService.setCourses(courses);
        this.resolveCourse();
      });
    }

    // Initial tee time load
    this.loadTeeTimes();

    // Re-run when the course ID changes (course switcher navigation)
    this.route.params.pipe(
      skip(1), // skip the initial emission — already handled in constructor
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(params => {
      this.courseId = +params['id'];
      this.resolveCourse();
      this.loadTeeTimes();
    });
  }

  changeCourse(newCourseId: number): void {
    if (newCourseId === this.courseId) return;
    this.router.navigate(['/course', newCourseId], {
      queryParams: {date: this.searchParams.date},
    });
  }

  onDateChange(date: Date): void {
    if (!date) return;
    this.searchParams.date = formatDate(date, 'yyyy-MM-dd', 'en-US');
    this.loadTeeTimes();
  }

  goBack(): void {
    this.router.navigate(['/teetimes'], {
      queryParams: {date: this.searchParams.date},
    });
  }

  bookTeeTime(teeTime: TeeTime): void {
    if (this.course) this.reservationDialogService.book(this.course, teeTime);
  }

  goToCoursePage(): void {
    if (this.course?.booking_url) window.open(this.course.booking_url, '_blank');
  }

  filterByHoles(holes: number): void {
    this.searchParams.holes = this.searchParams.holes === holes ? 10 : holes;
    this.refreshGroups();
  }
  formatTeeOff = formatTeeOff;

  filterByStart(section: string): void {
    this.activeStart = this.activeStart === section ? null : section;
    this.refreshGroups();
  }

  getHourRangeLabel(hour: number): string {
    const fmt = (h: number) => h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
    return `${fmt(hour)} — ${fmt((hour + 1) % 24)}`;
  }

  private resolveCourse(): void {
    this.course = this.dataSharingService.getCourseById(this.courseId)
      ?? this.allCourses.find(c => c.id === this.courseId);
  }

  private loadTeeTimes(): void {
    this.loading = true;
    this.error = false;
    this.activeStart = null;
    this.teeTimeService.getCourseTeeTimes(this.courseId, this.searchParams.date).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (times) => {
        this.teeTimes = times;
        setTimeout(() => {
          this.loading = false;
          this.refreshGroups();
        }, randomDelay())

      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  getHourFromLabel(label: string): number {
    const match = label.match(/(\d+)(am|pm)/);
    if (!match) return 0;
    let hour = parseInt(match[1], 10);
    if (match[2] === 'pm' && hour !== 12) hour += 12;
    if (match[2] === 'am' && hour === 12) hour = 0;
    return hour;
  }

  private refreshGroups(): void {
    this.hasStartOptions = this.teeTimes.some(t => t.start?.includes('BACK_NINE'));

    this.filteredTeeTimes = this.teeTimes
      .filter(t => this.searchParams.holes === 10 || t.holes.includes(this.searchParams.holes))
      .filter(t => !this.activeStart || !t.start || t.start.includes(this.activeStart));

    const groups: { [key: string]: TeeTime[] } = {};
    [...this.filteredTeeTimes]
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .forEach(t => {
        const key = this.getHourRangeLabel(new Date(t.time).getHours());
        (groups[key] ??= []).push(t);
      });

    this.hourGroups = Object.entries(groups)
      .map(([label, teeTimes]) => ({label, teeTimes}))
      .sort((a, b) => this.getHourFromLabel(a.label) - this.getHourFromLabel(b.label));
  }
}
