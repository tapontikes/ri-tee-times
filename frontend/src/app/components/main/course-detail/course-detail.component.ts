import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {formatDate} from '@angular/common';
import {Course, TeeTime, TeeTimeSearchParams} from "../../../model/models";
import {DataSharingService} from "../../../service/data-sharing.service";
import {ReservationDialogService} from "../../../service/registration-dialog.service";
import moment from "moment-timezone";

@Component({
    selector: 'app-course-detail',
    templateUrl: './course-detail.component.html',
    styleUrls: ['./course-detail.component.scss'],
    standalone: false
})
export class CourseDetailComponent implements OnInit {
  courseId: number = 0;
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
          this.course = this.dataSharingService.getCourseById(this.courseId)
          this.teeTimes = this.dataSharingService.getTeeTimesByCourseId(this.courseId);
        } else {
          this.router.navigate(['/']);
        }
      });
    });
  }

  changeCourse(newCourseId: number): void {
    if (newCourseId === this.courseId) {
      return;
    }
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

  getFilteredTeeTimes(): TeeTime[] {
    if (!this.teeTimes || !Array.isArray(this.teeTimes)) {
      return [];
    }

    let filteredTimes = this.teeTimes;

    if(this.searchParams.holes === 10){
      return filteredTimes;
    }

    if (this.searchParams.holes) {
      filteredTimes = filteredTimes.filter(teeTime =>
        teeTime.holes.includes(this.searchParams.holes)
      );
    }
    return filteredTimes;
  }

  getGroupedTeeTimesByHour(): { [key: string]: TeeTime[] } {
    const filteredTimes = this.getFilteredTeeTimes();

    const sortedTimes = filteredTimes.sort((a, b) => {
      const dateA = new Date(a.time);
      const dateB = new Date(b.time);
      return dateA.getTime() - dateB.getTime();
    });

    const groupedTimes: { [key: string]: TeeTime[] } = {};

    sortedTimes.forEach(teeTime => {
      const date = new Date(teeTime.time);
      const hour = date.getHours();
      const hourKey = this.getHourRangeLabel(hour);

      if (!groupedTimes[hourKey]) {
        groupedTimes[hourKey] = [];
      }

      groupedTimes[hourKey].push(teeTime);
    });

    return groupedTimes;
  }

  getHourRangeLabel(hour: number): string {
    const nextHour = (hour + 1) % 24;
    const currentHourLabel = hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`;
    const nextHourLabel = nextHour === 0 ? '12am' : nextHour < 12 ? `${nextHour}am` : nextHour === 12 ? '12pm' : `${nextHour - 12}pm`;

    return `${currentHourLabel} - ${nextHourLabel}`;
  }

  getSortedHourGroups(): { label: string, teeTimes: TeeTime[] }[] {
    const groupedTimes = this.getGroupedTeeTimesByHour();
    const result = [];

    for (const label in groupedTimes) {
      if (Object.prototype.hasOwnProperty.call(groupedTimes, label)) {
        result.push({
          label: label,
          teeTimes: groupedTimes[label]
        });
      }
    }

    return result.sort((a, b) => {
      const hourA = this.getHourFromLabel(a.label);
      const hourB = this.getHourFromLabel(b.label);
      return hourA - hourB;
    });
  }

  getHourFromLabel(label: string): number {
    const match = label.match(/(\d+)(am|pm)/);
    if (!match) return 0;
    const timeStr = match[1] + match[2];
    const time = moment(timeStr, 'ha');
    return time.hour();
  }

  filterByHoles(holes: number): void {
    if (this.searchParams.holes === holes) {
      this.searchParams.holes = 10;
    } else {
      this.searchParams.holes =  holes;
    }
  }

  goToCoursePage(url: string) {
    window.open(url, "_blank");
  }

}
