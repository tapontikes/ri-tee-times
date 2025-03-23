import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {interval, Subscription} from 'rxjs';
import * as moment from "moment-timezone";
import {DataSharingService} from "../../../../service/data-sharing.service";
import {Course, TeeTime} from "../../../../model/models";
import {SessionService} from "../../../../service/session.service";

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
    private sessionService: SessionService
  ) {
  }

  ngOnInit(): void {
    this.teeTime = this.dataSharingService.getSelectedTeeTime();
    this.course = this.dataSharingService.getSelectedCourse();
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
    this.processReservation();
  }

  processReservation(): void {
    this.submitting = true;

    this.http.post('/api/foreup/reserve', this.reservationForm.value)
      .subscribe(
        (response: any) => {
          this.submitting = false;
          if (response) {
            this.reservationData = response;
            this.timeRemaining = response.reservationQuote.holdDuration || 300;
            this.updateTimeDisplay();
            this.startTimer();
            this.reservationSuccess = true;
          }
        },
        (error) => this.handleError(error));

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
      (error) => this.handleError(error));
  }

  cancel(): void {
    this.router.navigate(['/']);
  }

  formatDateForApi(date: string | Date): string {
    return moment(date).format('MM-DD-YYYY');
  }


  private handleError(error: any) {
    this.submitting = false;
    this.completingReservation = false;

    if (error.status === 401) {
      this.sessionService.deleteSession(this.course.id);
      this.snackBar.open("Incorrect Credentials: Please login again", 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        }
      )

      this.router.navigate(['/foreup/login']);
    } else {
      this.snackBar.open(`Error: ${error.error?.error || 'Unknown error occured'}`, 'Close', {
        duration: 5000,
        panelClass: 'error-snackbar'
      });
    }
  }
}
