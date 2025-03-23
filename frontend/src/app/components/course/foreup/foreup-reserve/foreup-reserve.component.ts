import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {interval, Subscription} from 'rxjs';
import * as moment from "moment-timezone";
import {DataSharingService} from "../../../../service/data-sharing.service";
import {Course, TeeTime} from "../../../../model/models";
import {ForeupSessionService} from "../../../../service/foreup/foreup-session.service";

@Component({
  selector: 'app-foreup-reserve',
  templateUrl: './foreup-reserve.component.html',
  styleUrls: ['./foreup-reserve.component.scss']
})
export class ForeupReserveComponent implements OnInit, OnDestroy {
  reservationForm!: FormGroup;
  teeTime!: TeeTime;
  course!: Course;
  submitting: boolean = false;
  completingReservation: boolean = false;
  reservationSuccess: boolean = false;
  maxPlayers: number = 4;
  availableHoles: number[] = [9, 18];
  sessionActive: boolean = false;
  sessionExpiresAt: string | null = null;

  // Timer for reservation completion
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
    private foreupSessionService: ForeupSessionService
  ) {
  }

  ngOnInit(): void {
    // Get tee time data from service
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

    // Check if session is active
    if (this.course.id) {
      this.foreupSessionService.checkSession(this.course.id).subscribe(session => {
        this.sessionActive = session.isActive;
        this.sessionExpiresAt = session.expiresAt;

        if (!this.sessionActive) {
          // Redirect to login if session is not active
          this.snackBar.open('Your session has expired. Please login again.', 'Close', {
            duration: 5000
          });
          this.router.navigate(['/foreup/login']);
        }
      });
    }

    this.initForm();
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  initForm(): void {
    this.availableHoles = this.teeTime.holes;
    this.maxPlayers = this.teeTime.spots;

    const teeTimeDate = this.teeTime.time;
    const formattedTeeTime = this.formatDateForApi(teeTimeDate);

    this.reservationForm = this.fb.group({
      course_id: [this.course.id.toString(), Validators.required],
      domain: [this.course.booking_url, Validators.required],
      reservationData: this.fb.group({
        courseId: [this.course.request_data.course, Validators.required],
        teeTime: [formattedTeeTime, Validators.required],
        players: [Math.min(1, this.maxPlayers), [Validators.required, Validators.min(1), Validators.max(this.maxPlayers)]],
        holes: [this.teeTime.holes[0], Validators.required],
        teeOffSection: [this.teeTime.start || 'FRONT_NINE', Validators.required],
        addons: ['off', Validators.required]
      })
    });
  }

  onSubmit(): void {
    if (this.reservationForm.invalid) {
      return;
    }

    if (this.course) {
      this.foreupSessionService.checkSession(this.course.id).subscribe(session => {
        if (!session.isActive) {
          this.snackBar.open('Your session has expired. Please login again.', 'Close', {
            duration: 5000
          });
          this.router.navigate(['/foreup/login']);
          return;
        }

        // Session is active, proceed with reservation
        this.processReservation();
      });
    } else {
      this.processReservation();
    }
  }

  processReservation(): void {
    this.submitting = true;

    this.http.post('/api/foreup/reserve', this.reservationForm.value)
      .subscribe(
        (response: any) => {
          this.submitting = false;
          if (response.success) {
            this.reservationData = response;
            this.timeRemaining = response.reservationQuote.holdDuration || 300; // Default to 5 minutes if not provided
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
          this.submitting = false;
          if (this.course && this.course.id) {
            this.foreupSessionService.deleteSession(this.course.id);
          }
          // Check if error is due to session expiry
          if (error.status === 401 || (error.error && error.error.message && error.error.message.includes('session'))) {
            this.snackBar.open(`Session expired: Please login again`, 'Close', {
              duration: 5000,
              panelClass: 'error-snackbar'
            });
            this.router.navigate(['/foreup/login']);
          } else {
            this.snackBar.open(`Error: ${error.error?.error || 'Failed to process reservation'}`, 'Close', {
              duration: 5000,
              panelClass: 'error-snackbar'
            });
          }
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
        // Time's up - automatically redirect to home
        this.cancel();
        this.timerSubscription.unsubscribe();
      }
    });
  }

  completeReservation(): void {
    this.completingReservation = true;

    this.http.post('/api/foreup/confirm', {
      course_id: this.course.id.toString(),
      reservationId: this.reservationData.reservationQuote.id
    }).subscribe(
      (response: any) => {
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
      (error) => {
        this.completingReservation = false;
        // Check if error is due to session expiry
        if (error.status === 401 || (error.error && error.error.message && error.error.message.includes('session'))) {
          if (this.course && this.course.id) {
            this.foreupSessionService.deleteSession(this.course.id);
          }
          this.snackBar.open(`Session expired: Please login again`, 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
          this.router.navigate(['/foreup/login']);
        } else {
          this.snackBar.open(`Error: ${error.error?.error || 'Failed to complete reservation'}`, 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      }
    );
  }

  cancel(): void {
    this.router.navigate(['/']);
  }

  formatDateForApi(date: string | Date): string {
    return moment(date).format('MM-DD-YYYY');
  }

  // Format session expiry time for display
  formatExpiryTime(expiresAt: string | null): string {
    if (!expiresAt) return 'Unknown';
    return moment(expiresAt).format('MMMM Do YYYY, h:mm:ss a');
  }
}
