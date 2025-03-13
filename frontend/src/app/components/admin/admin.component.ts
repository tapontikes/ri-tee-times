import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Course, RefreshRequest} from "../../model/models";
import {TeeTimeService} from "../../service/teetime.service";
import {DataSharingService} from "../../service/data-sharing.service";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  refreshForm: FormGroup;
  searchForm: FormGroup;
  courses: Course[] = [];
  loading = false;
  refreshing = false;
  minDate = new Date();

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private teeTimeService: TeeTimeService,
    private dataSharingService: DataSharingService,
  ) {
    // Initialize refresh form
    this.refreshForm = this.fb.group({
      courseId: ['all', Validators.required],
      date: [new Date(), Validators.required]
    });

    // Initialize search form with default values (for future use)
    this.searchForm = this.fb.group({
      date: [new Date()],
      startTime: ['06:00'],
      endTime: ['18:00'],
      holes: [18]
    });
  }

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.loading = true;

    const existingCourses = this.dataSharingService.getCourses();

    if (existingCourses && existingCourses.length > 0) {
      // Use existing courses data
      this.courses = existingCourses;

    }
  }

  refreshTeeTimes(): void {
    if (this.refreshForm.valid) {
      this.refreshing = true;

      const formValues = this.refreshForm.value;
      const date = this.formatDate(formValues.date);
      const request: RefreshRequest = {date};

      if (formValues.courseId === 'all') {
        // Refresh all courses
        this.teeTimeService.refreshAllTeeTimes(request).subscribe(
          () => {
            this.handleRefreshSuccess('All courses');
          },
          (error) => {
            this.handleRefreshError(error);
          }
        );
      } else {
        // Refresh specific course
        const courseId = parseInt(formValues.courseId, 10);
        const courseName = this.courses.find(c => c.id === courseId)?.name || 'Selected course';

        this.teeTimeService.refreshCourseTeeTimes(courseId, request).subscribe(
          () => {
            this.handleRefreshSuccess(courseName);
          },
          (error) => {
            this.handleRefreshError(error);
          }
        );
      }
    }
  }

  handleRefreshSuccess(courseName: string): void {
    this.refreshing = false;
    this.snackBar.open(`${courseName} tee times refreshed successfully!`, 'Close', {
      duration: 5000,
      panelClass: 'success-snackbar'
    });
  }

  handleRefreshError(error: any): void {
    console.error('Error refreshing tee times:', error);
    this.refreshing = false;
    this.snackBar.open('Error refreshing tee times. Please try again.', 'Close', {
      duration: 5000,
      panelClass: 'error-snackbar'
    });
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) {
      month = '0' + month;
    }
    if (day.length < 2) {
      day = '0' + day;
    }

    return [year, month, day].join('-');
  }
}
