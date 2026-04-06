import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatCardModule} from '@angular/material/card';
import {interval, Subscription} from 'rxjs';
import moment from 'moment-timezone';
import {Course, TeeTime} from '../../../../shared/models/models';
import {DataSharingService} from '../../../../core/services/data-sharing.service';
import {SessionService} from '../../../../core/services/session.service';

@Component({
  selector: 'app-teesnap-reserve',
  templateUrl: './teesnap-reserve.component.html',
  styleUrls: ['./teesnap-reserve.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ]
})
export class TeesnapReserveComponent implements OnInit, OnDestroy {
  reservationForm!: FormGroup;
  teeTime!: TeeTime;
  course!: Course;
  submitting = false;
  completingReservation = false;
  reservationSuccess = false;
  maxPlayers = 4;
  availableHoles: number[] = [9, 18];
  timeRemaining = 0;
  timeInMinutes = 0;
  timeInSeconds = 0;
  timerSubscription!: Subscription;
  reservationData: any = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private dataSharingService: DataSharingService,
    private sessionService: SessionService
  ) {
  }

  ngOnInit(): void {
    this.teeTime = this.dataSharingService.getSelectedTeeTime();
    this.course = this.dataSharingService.getSelectedCourse();

    if (!this.teeTime || !this.course) {
      this.snackBar.open('No tee time data found. Please start over.', 'Close', {
        duration: 5000,
        panelClass: 'error-snackbar'
      });
      this.router.navigate(['/']);
      return;
    }
    this.initForm();
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
  }

  initForm(): void {
    this.availableHoles = this.teeTime.holes;
    this.maxPlayers = this.teeTime.spots;

    this.reservationForm = this.fb.group({
      reservationData: this.fb.group({
        courseId: [this.course.request_data.course, Validators.required],
        teeTime: [this.formatDateForApi(this.teeTime.time), Validators.required],
        players: [Math.min(1, this.maxPlayers), [Validators.required, Validators.min(1), Validators.max(this.maxPlayers)]],
        holes: [this.teeTime.holes[0], Validators.required],
        teeOffSection: [this.teeTime.start || 'FRONT_NINE', Validators.required],
        addons: ['off', Validators.required],
        domain: [this.course.booking_url, Validators.required]
      })
    });
  }

  onSubmit(): void {
    if (this.reservationForm.invalid) return;
    if (this.course.booking_url) {
      this.sessionService.checkSession(this.course.id, this.course.provider).subscribe(session => {
        if (!session) {
          this.snackBar.open('Your session has expired. Please login again.', 'Close', {duration: 5000});
          this.router.navigate(['/teesnap/login']);
          return;
        }
        this.processReservation();
      });
    } else {
      this.processReservation();
    }
  }

  processReservation(): void {
    this.submitting = true;
    this.http.post('/api/teesnap/reserve', this.reservationForm.value).subscribe({
      next: (response: any) => {
        this.submitting = false;
        if (response.success) {
          this.reservationData = response;
          this.timeRemaining = response.reservationQuote.holdDuration || 300;
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
      error: (err) => this.handleError(err)
    });
  }

  completeReservation(): void {
    this.completingReservation = true;
    this.http.post('/api/teesnap/confirm', {
      reservationId: this.reservationData.reservationQuote.id
    }).subscribe({
      next: (response: any) => {
        this.completingReservation = false;
        if (response.success) {
          this.snackBar.open('Reservation completed successfully!', 'Close', {
            duration: 5000,
            panelClass: 'success-snackbar'
          });
          this.router.navigate(['/']);
        } else {
          this.snackBar.open(`Failed to complete reservation: ${response.error}`, 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      },
      error: (err) => this.handleError(err)
    });
  }

  cancel(): void {
    this.router.navigate(['/']);
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
        this.cancel();
        this.timerSubscription.unsubscribe();
      }
    });
  }

  formatDateForApi(date: string | Date): string {
    return moment(date).tz('America/New_York').format('YYYY-MM-DDTHH:mm:ss');
  }

  private handleError(error: any): void {
    this.submitting = false;
    if (error.status === 401) {
      this.sessionService.deleteSession(this.course.id);
      this.snackBar.open('Incorrect Credentials: Please login again', 'Close', {
        duration: 5000,
        panelClass: 'error-snackbar'
      });
      this.router.navigate(['/teesnap/login']);
    } else {
      this.snackBar.open(`Error: ${error.error?.error || 'Unknown error occurred'}`, 'Close', {
        duration: 5000,
        panelClass: 'error-snackbar'
      });
    }
  }
}
