import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Course, TeeTime} from '../../../../shared/models/models';
import {DataSharingService} from '../../../../core/services/data-sharing.service';
import {SessionService} from '../../../../core/services/session.service';

@Component({
  selector: 'app-teesnap-login',
  templateUrl: './teesnap-login.component.html',
  styleUrls: ['./teesnap-login.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ]
})
export class TeesnapLoginComponent implements OnInit {
  loginForm!: FormGroup;
  hidePassword = true;
  submitting = false;
  teeTime!: TeeTime;
  course!: Course;

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

    this.sessionService.checkSession(this.course.id, this.course.provider).subscribe(session => {
      if (session) this.router.navigate(['/teesnap/reserve']);
    });

    this.loginForm = this.fb.group({
      id: [this.course.id, Validators.required],
      domain: [this.course.booking_url || '', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.submitting = true;
    this.http.post('/api/teesnap/login', this.loginForm.value).subscribe({
      next: (response: any) => {
        this.submitting = false;
        if (response) {
          this.sessionService.storeSession(response);
          this.router.navigate(['/teesnap/reserve']);
        }
      },
      error: (err) => this.handleError(err)
    });
  }

  cancel(): void {
    this.router.navigate(['/']);
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
