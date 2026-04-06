import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CommonModule, formatDate} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatChipsModule} from '@angular/material/chips';
import {Course, TeeTime, TeeTimeSearchParams} from '../../../shared/models/models';
import {DataSharingService} from '../../../core/services/data-sharing.service';
import {ReservationDialogService} from '../../booking/reservation-dialog.service';

@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
  ]
})
export class CourseDetailComponent implements OnInit {
  courseId = 0;
  allCourses: Course[] = [];
  course!: Course;
  teeTimes: TeeTime[] = [];
  error = false;
  searchParams: TeeTimeSearchParams;

  constructor(
    public reservationDialogService: ReservationDialogService,
    private dataSharingService: DataSharingService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.searchParams = {
      date: formatDate(new Date(), 'yyyy-MM-dd', 'en-US'),
      startTime: '06:00',
      endTime: '18:00',
      holes: 10
    };
  }

  ngOnInit(): void {
    this.allCourses = this.dataSharingService.getCourses();
    this.route.params.subscribe(params => {
      this.courseId = +params['id'];
      this.route.queryParams.subscribe(queryParams => {
        if (queryParams['date']) this.searchParams.date = queryParams['date'];
        if (queryParams['startTime']) this.searchParams.startTime = queryParams['startTime'];
        if (queryParams['endTime']) this.searchParams.endTime = queryParams['endTime'];

        const cachedCourses = this.dataSharingService.getCourses();
        const cachedTeeTimes = this.dataSharingService.getTeeTimes();

        if (cachedCourses.length > 0 && cachedTeeTimes.length > 0) {
          this.course = this.dataSharingService.getCourseById(this.courseId);
          this.teeTimes = this.dataSharingService.getTeeTimesByCourseId(this.courseId);
        } else {
          this.router.navigate(['/']);
        }
      });
    });
  }

  changeCourse(newCourseId: number): void {
    if (newCourseId === this.courseId) return;
    this.courseId = newCourseId;
    this.course = this.dataSharingService.getCourseById(this.courseId);
    this.teeTimes = this.dataSharingService.getTeeTimesByCourseId(this.courseId);
  }

  goBack(): void {
    this.router.navigate(['/'], {
      queryParams: {
        date: this.searchParams.date,
        startTime: this.searchParams.startTime,
        endTime: this.searchParams.endTime,
        holes: this.searchParams.holes
      }
    });
  }

  goToCoursePage(url: string): void {
    window.open(url, '_blank');
  }

  getFilteredTeeTimes(): TeeTime[] {
    if (this.searchParams.holes === 10) return this.teeTimes;
    return this.teeTimes.filter(t => t.holes.includes(this.searchParams.holes));
  }

  getGroupedTeeTimesByHour(): { [key: string]: TeeTime[] } {
    const groups: { [key: string]: TeeTime[] } = {};
    [...this.getFilteredTeeTimes()]
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .forEach(t => {
        const key = this.getHourRangeLabel(new Date(t.time).getHours());
        (groups[key] ??= []).push(t);
      });
    return groups;
  }

  getSortedHourGroups(): { label: string; teeTimes: TeeTime[] }[] {
    return Object.entries(this.getGroupedTeeTimesByHour())
      .map(([label, teeTimes]) => ({label, teeTimes}))
      .sort((a, b) => this.getHourFromLabel(a.label) - this.getHourFromLabel(b.label));
  }

  getHourRangeLabel(hour: number): string {
    const fmt = (h: number) => h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
    return `${fmt(hour)} - ${fmt((hour + 1) % 24)}`;
  }

  getHourFromLabel(label: string): number {
    const match = label.match(/(\d+)(am|pm)/);
    if (!match) return 0;
    let hour = parseInt(match[1], 10);
    if (match[2] === 'pm' && hour !== 12) hour += 12;
    if (match[2] === 'am' && hour === 12) hour = 0;
    return hour;
  }

  filterByHoles(holes: number): void {
    this.searchParams.holes = this.searchParams.holes === holes ? 10 : holes;
  }
}
