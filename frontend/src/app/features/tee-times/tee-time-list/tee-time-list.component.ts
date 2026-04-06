import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CommonModule, formatDate} from '@angular/common';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatChipsModule} from '@angular/material/chips';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Course, TeeTime, TeeTimeSearchParams} from '../../../shared/models/models';
import {TeeTimeService} from '../../../core/services/teetime.service';
import {DataSharingService} from '../../../core/services/data-sharing.service';
import {ReservationDialogService} from '../../booking/reservation-dialog.service';
import {FilterTeeTimePipe} from '../../../shared/pipes/filter-tee-time.pipe';
import {FilterCoursePipe} from '../../../shared/pipes/filter-course.pipe';
import {AddressInputComponent} from '../../../shared/components/address-input/address-input.component';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'app-tee-time-list',
  templateUrl: './tee-time-list.component.html',
  styleUrls: ['./tee-time-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    FilterTeeTimePipe,
    FilterCoursePipe,
    AddressInputComponent,
  ]
})
export class TeeTimeListComponent implements OnInit {
  courses: Course[] = [];
  teeTimes: TeeTime[] = [];
  providers = ['teesnap', 'foreup'];
  loading = true;
  error = false;
  selectedAddress?: string;
  searchParams: TeeTimeSearchParams;
  protected readonly environment = environment;

  constructor(
    private teeTimeService: TeeTimeService,
    private dataSharingService: DataSharingService,
    public reservationDialogService: ReservationDialogService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdk: ChangeDetectorRef
  ) {
    const now = new Date();
    const isAfter5PM = now.getHours() >= 17;
    this.searchParams = {
      date: formatDate(
        isAfter5PM ? new Date(now.setDate(now.getDate() + 1)) : now,
        'yyyy-MM-dd', 'en-US'
      ),
      startTime: '06:00',
      endTime: '18:00',
      holes: 9
    };
  }

  ngOnInit(): void {
    this.loading = true;
    this.selectedAddress = localStorage.getItem('selectedAddress') || '';
    this.dataSharingService.setUserLocation(this.selectedAddress);
    this.loadCourses();

    this.route.queryParams.subscribe(params => {
      if (params['date']) this.searchParams.date = params['date'];
      if (params['startTime']) this.searchParams.startTime = params['startTime'];
      if (params['endTime']) this.searchParams.endTime = params['endTime'];
      if (params['holes']) this.searchParams.holes = parseInt(params['holes'], 10);
      this.loadTeeTimes();
    });
  }

  loadCourses(): void {
    this.teeTimeService.getCourses().subscribe({
      next: async (coursesData) => {
        if (this.selectedAddress) {
          this.courses = await this.teeTimeService.mapCourseDrivingTime(coursesData, this.selectedAddress);
          this.cdk.detectChanges();
        } else {
          this.courses = coursesData;
        }
        this.dataSharingService.setCourses(this.courses);
      },
      error: () => {
        this.loading = false;
        this.error = true;
        this.snackBar.open('Error loading courses. Please try again.', 'Close', {duration: 5000});
      }
    });
  }

  loadTeeTimes(): void {
    this.teeTimeService.getAllTeeTimes(this.searchParams).subscribe({
      next: (teeTimesData) => {
        this.teeTimes = teeTimesData;
        this.dataSharingService.setTeeTimes(this.teeTimes);
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.snackBar.open('Error loading tee times. Please try again.', 'Close', {duration: 5000});
      }
    });
  }

  goToCoursePage(url: string): void {
    window.open(url, '_blank');
  }

  goToCourseDetail(courseId: number): void {
    this.dataSharingService.setTeeTimes(this.teeTimes);
    this.dataSharingService.setCourses(this.courses);
    this.router.navigate(['/course', courseId], {
      queryParams: {
        date: this.searchParams.date,
        startTime: this.searchParams.startTime,
        endTime: this.searchParams.endTime,
        holes: this.searchParams.holes
      }
    });
  }

  async onLocationSelected(place: google.maps.places.PlaceResult): Promise<void> {
    this.selectedAddress = place.formatted_address || '';
    this.loadCourses();
    this.cdk.detectChanges();
  }

  clearAddress(): void {
    this.selectedAddress = '';
    this.cdk.detectChanges();
  }

  getCity(address: string): string {
    const parts = address.split(',');
    return parts.length >= 2 ? parts[1].trim() : '';
  }
}
