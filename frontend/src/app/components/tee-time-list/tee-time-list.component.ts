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
    this.loadCourses();
    this.route.queryParams.subscribe(params => {
      // Update search params from query parameters if available
      if (params['date']) this.searchParams.date = params['date'];
      if (params['startTime']) this.searchParams.startTime = params['startTime'];
      if (params['endTime']) this.searchParams.endTime = params['endTime'];
      if (params['holes']) this.searchParams.holes = parseInt(params['holes'], 10);

      this.loadTeeTimes();
      this.sortCoursesByAvailability();
    });
  }

  loadCourses(): void {
    // Check if courses are already loaded in the data sharing service
    const existingCourses = this.dataSharingService.getCourses();

    if (existingCourses && existingCourses.length > 0) {
      // Use existing courses data
      this.courses = existingCourses;

      // Rebuild the course map
      this.courseMap.clear();
      this.courses.forEach(course => {
        this.courseMap.set(course.id, course);
      });

      return;
    }

    // Otherwise make the API call
    this.teeTimeService.getCourses().subscribe(
      (coursesData) => {
        this.courses = coursesData;

        // Create a map of course ID to course for easy lookup
        this.courseMap.clear();
        this.courses.forEach(course => {
          this.courseMap.set(course.id, course);
        });

        // Store courses in the sharing service
        this.dataSharingService.setCourses(this.courses);
      },
      (error) => {
        console.error('Error loading courses:', error);
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

        this.loading = false;

        // Store tee times in the sharing service
        this.dataSharingService.setTeeTimes(this.teeTimes);
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

  sortCoursesByAvailability(): void {
    this.courses = [...this.courses].sort((a, b) => {
      const aTeeTimesCount = this.getTeeTimesByCourseId(a.id).length;
      const bTeeTimesCount = this.getTeeTimesByCourseId(b.id).length;
      return bTeeTimesCount - aTeeTimesCount; // Descending order (most to least)
    });
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
