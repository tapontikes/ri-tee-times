import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Course, TeeTime} from "../../../../model/models";
import {DataSharingService} from "../../../../service/data-sharing.service";
import {SessionService} from "../../../../service/session.service";

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
    private snackBar: MatSnackBar,
    private dataSharingService: DataSharingService,
    private sessionService: SessionService
  ) {
  }

  ngOnInit(): void {
    this.teeTime = this.dataSharingService.getSelectedTeeTime();
    this.course = this.dataSharingService.getSelectedCourse();
    this.sessionService.checkSession(this.course.id, this.course.provider).subscribe(session => {
      if (session) {
        this.router.navigate(['/teesnap/reserve']);
      }
    });
    this.initForm();
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      id: [this.course.id, Validators.required],
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
          if (response) {
            this.sessionService.storeSession(response);
            this.router.navigate(['/teesnap/reserve']);
          }
        },
        (error) => this.handleError(error));
  }

  cancel(): void {
    this.router.navigate(['/']);
  }

  private handleError(error: any) {
    this.submitting = false;
    if (error.status === 401) {
      this.sessionService.deleteSession(this.course.id);
      this.snackBar.open("Incorrect Credentials: Please login again", 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        }
      )
      ;
      this.router.navigate(['/teesnap/login']);
    } else {
      this.snackBar.open(`Error: ${error.error?.error || 'Unknown error occured'}`, 'Close', {
        duration: 5000,
        panelClass: 'error-snackbar'
      });
    }
  }
}
