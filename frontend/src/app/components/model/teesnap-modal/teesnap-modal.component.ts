import {Component, Inject} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {HttpClient} from "@angular/common/http";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-teesnap-modal',
  templateUrl: './teesnap-modal.component.html',
  styleUrl: './teesnap-modal.component.scss'
})
export class TeesnapModalComponent {
  reservationForm: FormGroup;
  loading = false;
  submitting = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TeesnapModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.reservationForm = this.fb.group({
      domain: [data.domain || '', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      reservationData: this.fb.group({
        teeTimeId: [data.teeTime?.id || '', Validators.required],
        courseId: [data.course?.id || '', Validators.required],
        date: [data.date || '', Validators.required],
        time: [data.teeTime?.time || '', Validators.required],
        playerCount: [data.playerCount || 4, [Validators.required, Validators.min(1), Validators.max(4)]],
        holes: [data.teeTime?.holes?.[0] || 18, Validators.required]
      })
    });
  }

  onSubmit(): void {
    if (this.reservationForm.invalid) {
      return;
    }

    this.submitting = true;

    this.http.post('/api/tee-times/reserve', this.reservationForm.value)
      .subscribe(
        (response: any) => {
          this.submitting = false;
          if (response.success) {
            this.dialogRef.close(response);
            this.snackBar.open('Reservation successful!', 'Close', {
              duration: 5000,
              panelClass: 'success-snackbar'
            });
          } else {
            this.snackBar.open(`Reservation failed: ${response.error}`, 'Close', {
              duration: 5000,
              panelClass: 'error-snackbar'
            });
          }
        },
        (error) => {
          this.submitting = false;
          console.error('Error making reservation:', error);
          this.snackBar.open(`Error: ${error.error?.error || 'Failed to process reservation'}`, 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      );
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
