import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {formatDate} from '@angular/common';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Course, TeeTime, TeeTimeSearchParams} from "../../model/models";
import {TeeTimeService} from "../../service/teetime.service";
import {DataSharingService} from "../../service/data-sharing.service";
import {bookWithCourse} from "../../util/utils";

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
  bookWithCourse = bookWithCourse;

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
      holes: null
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
        //if (queryParams['holes']) this.searchParams.holes = parseInt(queryParams['holes'], 10);

        // Check if we already have the data
        const cachedCourses = this.dataSharingService.getCourses();
        const cachedTeeTimes = this.dataSharingService.getTeeTimes();

        if (cachedCourses.length > 0 && cachedTeeTimes.length > 0) {
          // Data is available in service - use it
          this.course = this.dataSharingService.getCourseById(this.courseId);
          this.teeTimes = this.dataSharingService.getTeeTimesByCourseId(this.courseId);
          this.loading = false;
        } else {
          // No data in service - need to load it
          this.loadCourseData();
        }
      });
    });
  }

  loadCourseData(): void {
    this.loading = true;
    this.error = false;

    // First load the courses to get course info
    this.teeTimeService.getCourses().subscribe(
      (courses) => {
        // Store in service
        this.dataSharingService.setCourses(courses);

        // Get the current course
        this.course = courses.find(c => c.id === this.courseId) || null

        if (this.course) {
          // Now load the tee times for this course
          this.teeTimeService.getCourseTeeTimes(this.courseId, this.searchParams).subscribe(
            (teeTimes) => {
              this.teeTimes = teeTimes;

              // Store all tee times in service
              this.dataSharingService.setTeeTimes(teeTimes);

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
        } else {
          this.error = true;
          this.loading = false;
          this.snackBar.open('Course not found.', 'Close', {
            duration: 5000
          });
        }
      },
      (error) => {
        console.error('Error loading courses:', error);
        this.error = true;
        this.loading = false;
        this.snackBar.open('Error loading course information. Please try again.', 'Close', {
          duration: 5000
        });
      }
    );
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

  filterByHoles(holes: number | null): void {
    // If same value is clicked again, toggle it off (set to null)
    if (this.searchParams.holes === holes) {
      this.searchParams.holes = null;
    } else {
      this.searchParams.holes = holes;
    }
  }

  getFilteredTeeTimes(): TeeTime[] {
    if (!this.teeTimes || !Array.isArray(this.teeTimes)) {
      return [];
    }

    // Start with all tee times for this course
    let filteredTimes = this.teeTimes;

    // Apply holes filter if selected
    if (this.searchParams.holes !== undefined && this.searchParams.holes !== null) {
      filteredTimes = filteredTimes.filter(teeTime =>
        teeTime.holes.includes(this.searchParams.holes as number)
      );
    }

    return filteredTimes;
  }
}
