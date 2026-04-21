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
import {lastValueFrom} from 'rxjs';

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
  refreshProgress = '';
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

    const {courseId, date} = this.refreshForm.value;
    const request: RefreshRequest = {date: formatDate(date)};

    if (courseId === 'all') {
      this.refreshAllCourses(request);
    } else {
      const id = parseInt(courseId, 10);
      const courseName = this.courses.find(c => c.id === id)?.name ?? 'Selected course';
      this.refreshing = true;
      this.teeTimeService.refreshCourseTeeTimes(id, request).subscribe({
        next: () => {
          this.refreshing = false;
          this.messageService.add({severity: 'success', summary: `${courseName} refreshed successfully.`, life: 4000});
        },
        error: () => {
          this.refreshing = false;
          this.messageService.add({severity: 'error', summary: `Failed to refresh ${courseName}.`, life: 5000});
        }
      });
    }
  }

  private async refreshAllCourses(request: RefreshRequest): Promise<void> {
    this.refreshing = true;
    let succeeded = 0;
    let failed = 0;

    for (const course of this.courses) {
      this.refreshProgress = `Refreshing ${course.name}...`;
      try {
        await lastValueFrom(this.teeTimeService.refreshCourseTeeTimes(course.id, request));
        succeeded++;
        this.messageService.add({
          severity: 'success',
          summary: course.name,
          detail: 'Refreshed successfully.',
          life: 4000
        });
      } catch {
        failed++;
        this.messageService.add({severity: 'error', summary: course.name, detail: 'Failed to refresh.', life: 6000});
      }
    }

    this.refreshing = false;
    this.refreshProgress = '';
    this.messageService.add({
      severity: failed === 0 ? 'success' : 'warn',
      summary: 'Done',
      detail: `${succeeded} succeeded, ${failed} failed.`,
      life: 6000
    });
  }
}
