import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {formatDate} from '@angular/common';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Course, TeeTime, TeeTimeSearchParams} from "../../model/models";
import {TeeTimeService} from "../../service/teetime.service";
import {DataSharingService} from "../../service/data-sharing.service";
import {bookWithCourse} from "../../util/utils";

@Component({
  selector: 'app-tee-time-list',
  templateUrl: './tee-time-list.component.html',
  styleUrls: ['./tee-time-list.component.scss']
})
export class TeeTimeListComponent implements OnInit {
  courses: Course[] = [];
  teeTimes: TeeTime[] = [];
  loading = true;
  error = false;
  searchParams: TeeTimeSearchParams;
  bookWithCourse = bookWithCourse;


  constructor(
    private teeTimeService: TeeTimeService,
    private dataSharingService: DataSharingService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    // Default search parameters
    const now = new Date();
    const isAfter5PM = now.getHours() >= 17;

    this.searchParams = {
      date: formatDate(
        isAfter5PM ? new Date(now.setDate(now.getDate() + 1)) : now,
        'yyyy-MM-dd',
        'en-US'
      ),
      startTime: '06:00',
      endTime: '18:00',
      holes: 9
    };
  }

  ngOnInit(): void {
    this.loading = true
    this.loadCourses();
    this.route.queryParams.subscribe(params => {
      if (params['date']) this.searchParams.date = params['date'];
      if (params['startTime']) this.searchParams.startTime = params['startTime'];
      if (params['endTime']) this.searchParams.endTime = params['endTime'];
      if (params['holes']) this.searchParams.holes = parseInt(params['holes'], 10);
      this.loadTeeTimes();
    });
  }

  loadCourses(): void {
    const existingCourses = this.dataSharingService.getCourses();

    if (existingCourses && existingCourses.length > 0) {
      // Use existing courses data
      this.courses = existingCourses;
      return;
    }

    // Otherwise make the API call
    this.teeTimeService.getCourses().subscribe(
      (coursesData) => {
        this.courses = coursesData;

        // Store courses in the sharing teetimes
        this.dataSharingService.setCourses(this.courses);
      },
      (error) => {
        console.error('Error loading courses:', error);
        this.loading = false;
        this.error = true;
        this.snackBar.open('Error loading courses. Please try again.', 'Close', {
          duration: 5000
        });
      }
    );
  }

  loadTeeTimes(): void {
    this.loading = true;
    this.error = false;

    // Load tee times based on search parameters
    this.teeTimeService.getAllTeeTimes(this.searchParams).subscribe(
      (teeTimesData) => {
        this.teeTimes = teeTimesData;

        // Sort courses by available tee times
        this.courses.sort((a, b) => {
          const aTeeTimesCount = this.getTeeTimesByCourseId(a.id).length;
          const bTeeTimesCount = this.getTeeTimesByCourseId(b.id).length;
          return bTeeTimesCount - aTeeTimesCount;
        });

        // Store tee times in the sharing teetimes
        this.dataSharingService.setTeeTimes(this.teeTimes);
        setTimeout(() => {
          this.loading = false;
        }, 750)
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

  getFilteredCourses(): Course[] {
    return this.courses.filter(course =>
      this.getTeeTimesByCourseId(course.id).length > 0
    );
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
