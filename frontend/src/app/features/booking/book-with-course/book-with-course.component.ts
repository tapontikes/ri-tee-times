import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {ButtonModule} from 'primeng/button';
import {TagModule} from 'primeng/tag';
import {DialogData} from '../../../shared/models/models';
import {formatTeeOff} from '../../../shared/utils';

@Component({
  selector: 'app-book-with-course',
  templateUrl: './book-with-course.component.html',
  styleUrl: './book-with-course.component.scss',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule]
})
export class BookWithCourseComponent {
  data: DialogData;
  formatTeeOff = formatTeeOff;

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {
    this.data = config.data;
  }

  cancel(): void {
    this.ref.close();
  }

  bookWithCourse(): void {
    if (this.data.course.booking_url) {
      window.open(this.data.course.booking_url, '_blank');
    }
  }
}
