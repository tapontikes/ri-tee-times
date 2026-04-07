import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {ButtonModule} from 'primeng/button';
import {DialogData} from '../../../shared/models/models';

@Component({
  selector: 'app-book-with-course',
  templateUrl: './book-with-course.component.html',
  styleUrl: './book-with-course.component.scss',
  standalone: true,
  imports: [CommonModule, ButtonModule]
})
export class BookWithCourseComponent {
  data: DialogData;

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
      this.ref.close({success: true});
    }
  }
}
