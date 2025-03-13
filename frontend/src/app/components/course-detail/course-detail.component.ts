import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {formatDate} from '@angular/common';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Course, TeeTime, TeeTimeSearchParams} from "../../model/models";
import {TeeTimeService} from "../../service/teetime.service";
import {DataSharingService} from "../../service/data-sharing.service";

@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss']
})
export class CourseDetailComponent implements OnInit {
  courseId: number = 0;
  course: Course | null = null;
  teeTimes: TeeTime[] = [];
  loading = true;
  error = false;
  searchParams: TeeTimeSearchParams;

  constructor(
    private teeTimeService: TeeTimeService,
    private dataSharingService: DataSharingService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    // Default search parameters
    this.searchParams = {
      date: formatDate(new Date(), 'yyyy-MM-dd', 'en-US'),
      startTime: '06:00',
      endTime: '18:00',
      holes: 18
    };
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.courseId = +params['id'];

      // Get query parameters if available
      this.route.queryParams.subscribe(queryParams => {
        if (queryParams['date']) this.searchParams.date = queryParams['date'];
        if (queryParams['startTime']) this.searchParams.startTime = queryParams['startTime'];
        if (queryParams['endTime']) this.searchParams.endTime = queryParams['endTime'];
        if (queryParams['holes']) this.searchParams.holes = parseInt(queryParams['holes'], 10);

        // Load data from the sharing service
        this.loadSharedData();
      });
    });
  }

  loadSharedData(): void {
    this.loading = true;

    // Get course information from the sharing service
    this.course = this.dataSharingService.getCourseById(this.courseId);

    // Get tee times for this course from the sharing service
    this.teeTimes = this.dataSharingService.getTeeTimesByCourseId(this.courseId);

    if (this.course && this.teeTimes.length > 0) {
      this.loading = false;
    } else {
      // If data is not available in the sharing service, show error
      this.error = true;
      this.loading = false;
      this.snackBar.open('No data available. Please go back to the main page.', 'Close', {
        duration: 5000
      });
    }
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

  isTimeInRange(timeString: string): boolean {
    if (!this.searchParams.startTime || !this.searchParams.endTime) return true;

    // Parse the ISO date string
    const time = new Date(timeString);
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const teeTimeMinutes = hours * 60 + minutes;

    const startTime = this.convertTimeToMinutes(this.searchParams.startTime);
    const endTime = this.convertTimeToMinutes(this.searchParams.endTime);

    return teeTimeMinutes >= startTime && teeTimeMinutes <= endTime;
  }

  convertTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  isAvailableForHoles(teeTime: TeeTime): boolean {
    return !this.searchParams.holes || teeTime.holes.includes(this.searchParams.holes);
  }

  getFilteredTeeTimes(): TeeTime[] {
    if (!this.teeTimes || !Array.isArray(this.teeTimes)) {
      return [];
    }

    return this.teeTimes.filter(teeTime =>
      this.isTimeInRange(teeTime.time) &&
      this.isAvailableForHoles(teeTime)
    );
  }
}
