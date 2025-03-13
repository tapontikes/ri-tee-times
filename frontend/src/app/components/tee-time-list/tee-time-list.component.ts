import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {formatDate} from '@angular/common';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Course, TeeTime, TeeTimeSearchParams} from "../../model/models";
import {TeeTimeService} from "../../service/teetime.service";
import {DataSharingService} from "../../service/data-sharing.service";

@Component({
  selector: 'app-tee-time-list',
  templateUrl: './tee-time-list.component.html',
  styleUrls: ['./tee-time-list.component.scss']
})
export class TeeTimeListComponent implements OnInit {
  courses: Course[] = [];
  teeTimes: TeeTime[] = [];
  courseMap: Map<number, Course> = new Map();
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
    this.route.queryParams.subscribe(params => {
      // Update search params from query parameters if available
      if (params['date']) this.searchParams.date = params['date'];
      if (params['startTime']) this.searchParams.startTime = params['startTime'];
      if (params['endTime']) this.searchParams.endTime = params['endTime'];
      if (params['holes']) this.searchParams.holes = parseInt(params['holes'], 10);

      this.loadTeeTimes();
    });
  }

  loadTeeTimes(): void {
    this.loading = true;
    this.error = false;

    // First, load the courses to get their information
    this.teeTimeService.getCourses().subscribe(
      (coursesData) => {
        this.courses = coursesData;

        // Create a map of course ID to course for easy lookup
        this.courseMap.clear();
        this.courses.forEach(course => {
          this.courseMap.set(course.id, course);
        });

        // Then load the tee times
        this.teeTimeService.getAllTeeTimes(this.searchParams).subscribe(
          (teeTimesData) => {
            this.teeTimes = teeTimesData;
            this.loading = false;
          },
          (error) => {
            console.error('Error loading tee times:', error);
            this.error = true;
            this.loading = false;
            this.snackBar.open('Error loading tee times. Please try again.', 'Close', {
              duration: 5000
            });
          }
        );
      },
      (error) => {
        console.error('Error loading courses:', error);
        this.error = true;
        this.loading = false;
        this.snackBar.open('Error loading courses. Please try again.', 'Close', {
          duration: 5000
        });
      }
    );
  }

  bookTeeTime(teeTime: TeeTime): void {
    const course = this.courseMap.get(teeTime.courseId);
    if (course) {
      window.open(course.bookingUrl, '_blank');
    }
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
    return this.teeTimes.filter(teeTime =>
      this.isTimeInRange(teeTime.time) &&
      this.isAvailableForHoles(teeTime)
    );
  }

  // Group tee times by course ID
  getTeeTimesByCourseId(courseId: number): TeeTime[] {
    return this.getFilteredTeeTimes().filter(teeTime => teeTime.courseId === courseId);
  }

  goToCourseDetail(courseId: number, event?: MouseEvent): void {
    // Store the current search parameters and data
    this.dataSharingService.setTeeTimes(this.teeTimes);
    this.dataSharingService.setCourses(this.courses);

    // Navigate to the course detail page
    this.router.navigate(['/course', courseId], {
      queryParams: {
        date: this.searchParams.date,
        startTime: this.searchParams.startTime,
        endTime: this.searchParams.endTime,
        holes: this.searchParams.holes
      }
    });
  }
}
