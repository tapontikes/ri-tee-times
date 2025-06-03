import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Course, TeeTime} from "../../../../model/models";
import {DataSharingService} from "../../../../service/data-sharing.service";
import {SessionService} from "../../../../service/session.service";

@Component({
    selector: 'app-foreup-login',
    templateUrl: './foreup-login.component.html',
    styleUrls: ['./foreup-login.component.scss'],
    standalone: false
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
    private snackBar: MatSnackBar,
    private dataSharingService: DataSharingService,
    private sessionService: SessionService
  ) {
  }

  ngOnInit(): void {
    this.teeTime = this.dataSharingService.getSelectedTeeTime();
    this.course = this.dataSharingService.getSelectedCourse();

    if (this.course) {
      this.sessionService.checkSession(this.course.id, this.course.provider).subscribe(session => {
        if (session) {
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
          if (response) {
            this.sessionService.storeSession(response);
            this.router.navigate(['/foreup/reserve']);
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
      this.router.navigate(['/foreup/login']);
    } else {
      this.snackBar.open(`Error: ${error.error?.error || 'Unknown error occured'}`, 'Close', {
        duration: 5000,
        panelClass: 'error-snackbar'
      });
    }
  }

}
