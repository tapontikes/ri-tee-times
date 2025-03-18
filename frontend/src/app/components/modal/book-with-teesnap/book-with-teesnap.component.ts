import {Component, Inject, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {HttpClient} from '@angular/common/http';
import {MatSnackBar} from '@angular/material/snack-bar';
import {interval, Subscription} from 'rxjs';
import moment from "moment-timezone";
import {Course, DialogData, TeeTime} from "../../../model/models";

@Component({
  selector: 'app-book-with-teesnap',
  templateUrl: './book-with-teesnap.component.html',
  styleUrl: './book-with-teesnap.component.scss'
})

export class BookWithTeesnapComponent implements OnDestroy {

  course: Course;
  teeTime: TeeTime;
  reservationForm!: FormGroup;

  hidePassword: boolean = true;
  submitting: boolean = false;
  completingReservation: boolean = false;
  reservationSuccess: boolean = false;
  maxPlayers: number = 4;
  availableHoles: number[] = [9, 18];

  // Timer for reservation completion
  timeRemaining = 0;
  timeInMinutes = 0;
  timeInSeconds = 0;
  timerSubscription!: Subscription;
  reservationData: any = null;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<BookWithTeesnapComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.course = data.course
    this.teeTime = data.teeTime
    this.initForm();
  }

  initForm(): void {
    this.availableHoles = this.teeTime.holes;
    this.maxPlayers = this.teeTime.spots;

    const teeTimeDate = this.teeTime.time;
    const formattedTeeTime = this.formatDateForApi(teeTimeDate);


    this.reservationForm = this.fb.group({
      domain: [this.data.course.booking_url || '', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      reservationData: this.fb.group({
        courseId: [this.course.request_data.course, Validators.required],
        teeTime: [formattedTeeTime, Validators.required],
        players: [Math.min(1, this.maxPlayers), [Validators.required, Validators.min(1), Validators.max(this.maxPlayers)]],
        holes: [this.data.teeTime.holes[0], Validators.required],
        teeOffSection: [this.data.teeTime.start || 'FRONT_NINE', Validators.required],
        addons: ['off', Validators.required]
      })
    });
  }


  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  onSubmit(): void {
    if (this.reservationForm.get('email')?.invalid || this.reservationForm.get('password')?.invalid) {
      return;
    }

    this.submitting = true;

    this.http.post('/api/teesnap/reserve', this.reservationForm.value)
      .subscribe(
        (response: any) => {
          this.submitting = false;
          if (response.success) {
            this.reservationData = response;
            this.timeRemaining = response.reservationQuote.holdDuration
            this.updateTimeDisplay();
            this.startTimer();

            this.reservationSuccess = true;
          } else {
            this.snackBar.open(`Reservation failed: ${response.error}`, 'Close', {
              duration: 5000,
              panelClass: 'error-snackbar'
            });
          }
        },
        (error) => {
          console.log(error);
          this.submitting = false;
          console.error('Error processing reservation:', error);
          this.snackBar.open(`Error: ${error.error.responseData?.errors || 'Failed to process reservation'}`, 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      );
  }

  updateTimeDisplay(): void {
    this.timeInMinutes = Math.floor(this.timeRemaining / 60);
    this.timeInSeconds = this.timeRemaining % 60;
  }

  startTimer(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
        this.updateTimeDisplay();
      } else {
        // Time's up - automatically close the dialog
        this.cancel();
        this.timerSubscription.unsubscribe();
      }
    });
  }

  completeReservation(): void {
    this.completingReservation = true;

    this.http.post('/api/tee-times/complete-reservation', {
      reservationId: this.reservationData.reservationQuote.id
    }).subscribe(
      (response: any) => {
        this.completingReservation = false;
        if (response.success) {
          this.snackBar.open('Reservation completed successfully!', 'Close', {
            duration: 5000,
            panelClass: 'success-snackbar'
          });
          this.dialogRef.close(response);
        } else {
          this.snackBar.open(`Failed to complete reservation: ${response.error}`, 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      },
      (error) => {
        this.completingReservation = false;
        console.error('Error completing reservation:', error);
        this.snackBar.open(`Error: ${error.error?.error || 'Failed to complete reservation'}`, 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      }
    );
  }

  cancel(): void {
    this.dialogRef.close();
  }

  formatDateForApi(date: string | Date): string {
    return moment(date).tz('America/New_York').format('YYYY-MM-DDTHH:mm:ss');
  }
}
