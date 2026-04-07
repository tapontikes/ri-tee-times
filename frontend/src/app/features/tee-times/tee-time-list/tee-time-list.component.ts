import {ChangeDetectorRef, Component, DestroyRef, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CommonModule, formatDate} from '@angular/common';
import {TagModule} from 'primeng/tag';
import {ButtonModule} from 'primeng/button';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Course, TeeTime, TeeTimeSearchParams} from '../../../shared/models/models';
import {TeeTimeService} from '../../../core/services/teetime.service';
import {DataSharingService} from '../../../core/services/data-sharing.service';
import {ReservationDialogService} from '../../booking/reservation-dialog.service';
import {FilterTeeTimePipe} from '../../../shared/pipes/filter-tee-time.pipe';
import {FilterCoursePipe} from '../../../shared/pipes/filter-course.pipe';
import {AddressInputComponent} from '../../../shared/components/address-input/address-input.component';
import {environment} from '../../../../environments/environment';
import {randomDelay} from "../../../shared/utils";

@Component({
  selector: 'app-tee-time-list',
  templateUrl: './tee-time-list.component.html',
  styleUrls: ['./tee-time-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TagModule,
    ButtonModule,
    FilterTeeTimePipe,
    FilterCoursePipe,
    AddressInputComponent,
  ],
})
export class TeeTimeListComponent implements OnInit {
  courses: Course[] = [];
  teeTimes: TeeTime[] = [];
  readonly skeletonCards = Array(5);
  readonly skeletonTiles = Array(4);
  providers = ['teesnap', 'foreup'];
  loading = true;
  error = false;
  selectedAddress?: string;
  searchParams: TeeTimeSearchParams;
  protected readonly environment = environment;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private teeTimeService: TeeTimeService,
    private dataSharingService: DataSharingService,
    public reservationDialogService: ReservationDialogService,
    private route: ActivatedRoute,
    private router: Router,
    private cdk: ChangeDetectorRef,
  ) {
    const now = new Date();
    const isAfter5PM = now.getHours() >= 17;
    this.searchParams = {
      date: formatDate(
        isAfter5PM ? new Date(now.setDate(now.getDate() + 1)) : now,
        'yyyy-MM-dd', 'en-US',
      ),
      startTime: '06:00',
      endTime: '18:00',
      holes: 9,
    };
  }

  ngOnInit(): void {
    this.loading = true;
    this.selectedAddress = localStorage.getItem('selectedAddress') || '';
    this.dataSharingService.setUserLocation(this.selectedAddress);
    this.loadCourses();

    // Serialize params to a string so distinctUntilChanged can compare them
    this.route.queryParams.pipe(
      map(params => JSON.stringify({
        date: params['date'] ?? this.searchParams.date,
        startTime: params['startTime'] ?? this.searchParams.startTime,
        endTime: params['endTime'] ?? this.searchParams.endTime,
        holes: params['holes'] ?? this.searchParams.holes,
      })),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(paramsJson => {
      const params = JSON.parse(paramsJson);
      this.searchParams.date = params.date;
      this.searchParams.startTime = params.startTime;
      this.searchParams.endTime = params.endTime;
      this.searchParams.holes = parseInt(params.holes, 10);
      this.loadTeeTimes();
    });
  }

  loadCourses(): void {
    this.teeTimeService.getCourses().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
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
      },
    });
  }

  loadTeeTimes(): void {
    this.loading = true;
    this.error = false;
    this.teeTimeService.getAllTeeTimes(this.searchParams).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (teeTimesData) => {
        this.teeTimes = teeTimesData;
        this.dataSharingService.setTeeTimes(this.teeTimes);
        setTimeout(() => {
          this.loading = false;
        }, randomDelay())
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  goToCoursePage(url: string): void {
    window.open(url, '_blank');
  }

  goToCourseDetail(courseId: number): void {
    this.dataSharingService.setTeeTimes(this.teeTimes);
    this.dataSharingService.setCourses(this.courses);
    this.router.navigate(['/course', courseId], {
      queryParams: {date: this.searchParams.date, holes: this.searchParams.holes},
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
