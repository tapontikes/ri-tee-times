import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Course, TeeTime} from "../../../../model/models";
import {DataSharingService} from "../../../../service/data-sharing.service";
import {ForeupSessionService} from "../../../../service/foreup/foreup-session.service";

@Component({
  selector: 'app-foreup-login',
  templateUrl: './foreup-login.component.html',
  styleUrls: ['./foreup-login.component.scss']
})
export class ForeupLoginComponent implements OnInit {
  loginForm!: FormGroup;
  hidePassword: boolean = true;
  submitting: boolean = false;
  courseId: string = '';
  teeTime!: TeeTime;
  course!: Course;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private dataSharingService: DataSharingService,
    private foreupSessionService: ForeupSessionService
  ) {
  }

  ngOnInit(): void {
    this.teeTime = this.dataSharingService.getSelectedTeeTime();
    this.course = this.dataSharingService.getSelectedCourse();

    if (this.course) {
      this.foreupSessionService.checkSession(this.course.id).subscribe(session => {
        if (session.isActive) {
          // If we have an active session, redirect to the reserve page
          this.router.navigate(['/foreup/reserve']);
        }
      });
    } else {
      this.router.navigate(['/']);
    }

    this.initForm();
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      courseId: [this.course.request_data.id, Validators.required],
      courseName: [this.course.name, Validators.required],
      id: [this.course.id, Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.submitting = true;

    this.http.post('/api/foreup/login', this.loginForm.value)
      .subscribe(
        (response: any) => {
          this.submitting = false;
          if (response.success) {
            // Store session info after successful login
            if (response.session) {
              this.foreupSessionService.storeSession(response.session);
            }

            this.router.navigate(['/foreup/reserve']);
          } else {
            this.snackBar.open(`Login failed: ${response.error}`, 'Close', {
              duration: 5000,
              panelClass: 'error-snackbar'
            });
          }
        },
        (error) => {
          this.submitting = false;
          console.error('Error during login:', error);
          this.snackBar.open(`Error: ${error.error?.error || 'Login failed'}`, 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      );
  }

  cancel(): void {
    this.router.navigate(['/']);
  }
}
