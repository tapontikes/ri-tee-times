import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MessageService} from 'primeng/api';
import {SelectModule} from 'primeng/select';
import {ButtonModule} from 'primeng/button';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {DatePickerModule} from 'primeng/datepicker';
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
    SelectModule,
    ButtonModule,
    ProgressSpinnerModule,
    DatePickerModule,
  ]
})
export class AdminComponent implements OnInit {
  refreshForm: FormGroup;
  courses: Course[] = [];
  refreshing = false;
  minDate = new Date();

  get courseOptions() {
    return [{label: 'All Courses', value: 'all'}, ...this.courses.map(c => ({label: c.name, value: c.id}))];
  }

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
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
      error: () => this.messageService.add({severity: 'error', summary: 'Error loading courses.', life: 3000})
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
    this.messageService.add({
      severity: 'success',
      summary: `${courseName} tee times refreshed successfully!`,
      life: 5000
    });
  }

  private handleRefreshError(_error: any): void {
    this.refreshing = false;
    this.messageService.add({severity: 'error', summary: 'Error refreshing tee times. Please try again.', life: 5000});
  }
}
