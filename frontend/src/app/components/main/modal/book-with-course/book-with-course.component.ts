import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {DialogData} from "../../../../model/models";

@Component({
  selector: 'app-book-with-course',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './book-with-course.component.html',
  styleUrl: './book-with-course.component.scss'
})
export class BookWithCourseComponent {
  constructor(
    public dialogRef: MatDialogRef<BookWithCourseComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
  }


  cancel(): void {
    this.dialogRef.close();
  }

  bookWithCourse(): void {
    if (this.data.course.booking_url) {
      window.open(this.data.course.booking_url, '_blank');
      this.dialogRef.close({success: true});
    }
  }
}
