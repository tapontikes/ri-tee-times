import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {MessageService} from 'primeng/api';
import {SelectModule} from 'primeng/select';
import {ButtonModule} from 'primeng/button';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {interval, Subscription} from 'rxjs';
import {Course, TeeTime} from '../../../../shared/models/models';
import {DataSharingService} from '../../../../core/services/data-sharing.service';
import {SessionService} from '../../../../core/services/session.service';

@Component({
  selector: 'app-foreup-reserve',
  templateUrl: './foreup-reserve.component.html',
  styleUrls: ['./foreup-reserve.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectModule,
    ButtonModule,
    ProgressSpinnerModule,
  ]
})
export class ForeupReserveComponent implements OnInit, OnDestroy {
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
    private messageService: MessageService,
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
    this.timerSubscription?.unsubscribe();
  }

  get playerOptions() {
    return Array.from({length: this.maxPlayers}, (_, i) => ({
      label: `${i + 1} Player${i > 0 ? 's' : ''}`,
      value: i + 1
    }));
  }

  get holeOptions() {
    return this.availableHoles.map(h => ({label: `${h} Holes`, value: h}));
  }

  initForm(): void {
    this.availableHoles = this.teeTime.holes;
    this.maxPlayers = this.teeTime.spots;
    const formattedTeeTime = this.formatDateForApi(this.teeTime.time);

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
    if (this.reservationForm.invalid) return;
    this.submitting = true;
    this.http.post('/api/foreup/reserve', this.reservationForm.value).subscribe({
      next: (response: any) => {
        this.submitting = false;
        if (response) {
          this.reservationData = response;
          this.timeRemaining = response.reservationQuote.holdDuration || 300;
          this.updateTimeDisplay();
          this.startTimer();
          this.reservationSuccess = true;
        }
      },
      error: (err) => this.handleError(err)
    });
  }

  completeReservation(): void {
    this.completingReservation = true;
    this.http.post('/api/foreup/confirm', {
      course_id: this.course.id.toString(),
      reservationId: this.reservationData.reservationQuote.id
    }).subscribe({
      next: (response: any) => {
        this.completingReservation = false;
        if (response.success) {
          this.messageService.add({severity: 'success', summary: 'Reservation completed successfully!', life: 5000});
          this.router.navigate(['/']);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: `Failed to complete reservation: ${response.error}`,
            life: 5000
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
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${month}-${day}-${d.getFullYear()}`;
  }

  private handleError(error: any): void {
    this.submitting = false;
    this.completingReservation = false;
    if (error.status === 401) {
      this.sessionService.deleteSession(this.course.id);
      this.messageService.add({severity: 'error', summary: 'Incorrect Credentials: Please login again', life: 5000});
      this.router.navigate(['/foreup/login']);
    } else {
      this.messageService.add({
        severity: 'error',
        summary: `Error: ${error.error?.error || 'Unknown error occurred'}`,
        life: 5000
      });
    }
  }
}
