import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CommonModule, formatDate} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {TagModule} from 'primeng/tag';
import {SelectModule} from 'primeng/select';
import {FormsModule} from '@angular/forms';
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
    ButtonModule,
    TagModule,
    SelectModule,
    FormsModule,
  ]
})
export class CourseDetailComponent implements OnInit {
  courseId = 0;
  allCourses: Course[] = [];
  course!: Course;
  teeTimes: TeeTime[] = [];
  filteredTeeTimes: TeeTime[] = [];
  hourGroups: { label: string; teeTimes: TeeTime[] }[] = [];
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
          this.refreshGroups();
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
    this.refreshGroups();
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
    this.refreshGroups();
  }

  private refreshGroups(): void {
    this.filteredTeeTimes = this.searchParams.holes === 10
      ? this.teeTimes
      : this.teeTimes.filter(t => t.holes.includes(this.searchParams.holes));

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
