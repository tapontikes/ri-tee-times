import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {formatDate} from '@angular/common';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Course, TeeTime, TeeTimeSearchParams} from "../../../model/models";
import {TeeTimeService} from "../../../service/teetime.service";
import {DataSharingService} from "../../../service/data-sharing.service";
import {ReservationDialogService} from "../../../service/registration-dialog.service";
import {environment} from '../../../../environments/environment';
import moment from "moment";

@Component({
    selector: 'app-tee-time-list',
    templateUrl: './tee-time-list.component.html',
    styleUrls: ['./tee-time-list.component.scss'],
    standalone: false
})
export class TeeTimeListComponent implements OnInit {
  protected readonly environment = environment;
  courses: Course[] = [];
  teeTimes: TeeTime[] = [];
  providers = ["teesnap", "foreup"]
  loading = true;
  error = false;
  selectedAddress?: string;
  searchParams: TeeTimeSearchParams;

  constructor(
    private teeTimeService: TeeTimeService,
    private dataSharingService: DataSharingService,
    public reservationDialogService: ReservationDialogService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdk: ChangeDetectorRef
  ) {
    // Default search parameters
    const now = new Date();
    const isAfter5PM = now.getHours() >= 17;

    this.searchParams = {
      date: formatDate(
        isAfter5PM ? new Date(now.setDate(now.getDate() + 1)) : now,
        'yyyy-MM-dd',
        'en-US'
      ),
      startTime: '06:00',
      endTime: '18:00',
      holes: 9
    };
  }

  ngOnInit(): void {
    this.loading = true
    this.selectedAddress = localStorage.getItem("selectedAddress") || "";
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
    this.teeTimeService.getCourses().subscribe(
      async (coursesData) => {
        if (this.selectedAddress) {
          this.courses = await this.teeTimeService.mapCourseDrivingTime(coursesData, this.selectedAddress);
          this.cdk.detectChanges();
        } else {
          this.courses = coursesData;
        }
        this.dataSharingService.setCourses(this.courses);
      },
      (error) => {
        console.error('Error loading courses:', error);
        this.loading = false;
        this.error = true;
        this.snackBar.open('Error loading courses. Please try again.', 'Close', {
          duration: 5000
        });
      }
    );
  }

  loadTeeTimes(): void {
    this.teeTimeService.getAllTeeTimes(this.searchParams).subscribe(
      teeTimesData => {
        this.teeTimes = teeTimesData;
        this.dataSharingService.setTeeTimes(this.teeTimes);
        setTimeout(() => {
          this.loading = false;
        }, 750)
      },
      error => {
        console.error('Error loading tee times:', error);
        this.error = true;
        this.loading = false;
        this.snackBar.open('Error loading tee times. Please try again.', 'Close', {
          duration: 5000
        });
      }
    );
  }

  goToCoursePage(url: string) {
    window.open(url, "_blank");
  }

  goToCourseDetail(courseId: number, event?: MouseEvent): void {
    this.dataSharingService.setTeeTimes(this.teeTimes);
    this.dataSharingService.setCourses(this.courses);

    // Navigate to the course detail page
    this.router.navigate(['/course', courseId], {
      queryParams: {
        date: this.searchParams.date,
        startTime: this.searchParams.startTime,
        endTime: this.searchParams.endTime,
        holes: this.searchParams.holes
      }
    });
  }

  async onLocationSelected(place: google.maps.places.PlaceResult) {
    this.selectedAddress = place.formatted_address || "";
    this.loadCourses();
    this.cdk.detectChanges();
  }

  clearAddress(){
    this.selectedAddress = "";
    this.cdk.detectChanges();
  }

  getCity(address: string){
    const parts = address.split(',');
    let city = '';
    if (parts.length >= 2) {
      return parts[1].trim();
    }
    return city;
  }

  protected readonly moment = moment;
}
