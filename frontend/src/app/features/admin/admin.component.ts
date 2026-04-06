import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {Course, RefreshRequest} from '../../shared/models/models';
import {TeeTimeService} from '../../core/services/teetime.service';
import {formatDate} from '../../shared/utils';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
  ]
})
export class AdminComponent implements OnInit {
  refreshForm: FormGroup;
  courses: Course[] = [];
  refreshing = false;
  minDate = new Date();

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private teeTimeService: TeeTimeService
  ) {
    this.refreshForm = this.fb.group({
      courseId: ['all', Validators.required],
      date: [new Date(), Validators.required]
    });
  }

  ngOnInit(): void {
    this.teeTimeService.getCourses().subscribe({
      next: (courses) => this.courses = courses,
      error: () => this.snackBar.open('Error loading courses.', 'Close', {duration: 3000})
    });
  }

  refreshTeeTimes(): void {
    if (!this.refreshForm.valid) return;

    this.refreshing = true;
    const {courseId, date} = this.refreshForm.value;
    const request: RefreshRequest = {date: formatDate(date)};

    if (courseId === 'all') {
      this.teeTimeService.refreshAllTeeTimes(request).subscribe({
        next: () => this.handleRefreshSuccess('All courses'),
        error: (err) => this.handleRefreshError(err)
      });
    } else {
      const id = parseInt(courseId, 10);
      const courseName = this.courses.find(c => c.id === id)?.name ?? 'Selected course';
      this.teeTimeService.refreshCourseTeeTimes(id, request).subscribe({
        next: () => this.handleRefreshSuccess(courseName),
        error: (err) => this.handleRefreshError(err)
      });
    }
  }

  private handleRefreshSuccess(courseName: string): void {
    this.refreshing = false;
    this.snackBar.open(`${courseName} tee times refreshed successfully!`, 'Close', {
      duration: 5000,
      panelClass: 'success-snackbar'
    });
  }

  private handleRefreshError(error: any): void {
    this.refreshing = false;
    this.snackBar.open('Error refreshing tee times. Please try again.', 'Close', {
      duration: 5000,
      panelClass: 'error-snackbar'
    });
  }
}
