import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Course, TeeTime} from "../../../../model/models";
import {DataSharingService} from "../../../../service/data-sharing.service";
import {TeesnapSessionService} from "../../../../service/teesnap/teesnap-session.service";

@Component({
  selector: 'app-teesnap-login',
  templateUrl: './teesnap-login.component.html',
  styleUrls: ['./teesnap-login.component.scss']
})
export class TeesnapLoginComponent implements OnInit {
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
    private teesnapSessionService: TeesnapSessionService
  ) {
  }

  ngOnInit(): void {
    this.teeTime = this.dataSharingService.getSelectedTeeTime();
    this.course = this.dataSharingService.getSelectedCourse();

    // Check if we already have a valid session
    if (this.course && this.course.booking_url) {
      this.teesnapSessionService.checkSession(this.course.booking_url).subscribe(session => {
        if (session.isActive) {
          // If we have an active session, redirect to the reserve page
          this.router.navigate(['/teesnap/reserve']);
        }
      });
    }

    this.initForm();
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      domain: [this.course.booking_url || '', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.submitting = true;

    this.http.post('/api/teesnap/login', this.loginForm.value)
      .subscribe(
        (response: any) => {
          this.submitting = false;
          if (response.success) {
            // Store session info after successful login
            if (response.session) {
              this.teesnapSessionService.storeSession(response.session);
            }

            this.router.navigate(['/teesnap/reserve']);
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
