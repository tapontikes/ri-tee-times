import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {Course, RefreshRequest, TeeTime, TeeTimeSearchParams} from "../model/models";
import {DistanceService} from "./distance.service";
import {DataSharingService} from "./data-sharing.service";

@Injectable({
  providedIn: 'root'
})
export class TeeTimeService {

  private readonly apiUrl = window.location.protocol + '//' + window.location.host + "/api/tee-times";

  constructor(private http: HttpClient, private distanceService: DistanceService, private dataSharingService: DataSharingService) { }

  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/courses`);
  }

  async mapCourseDrivingTime(courses: Course[], location: string): Promise<Course[]> {
    if (!location) return courses;
    localStorage.setItem('selectedAddress', location);
    return await Promise.all(
      courses.map(async course => {
        const locationCacheKey = `${location}-${course.address}`;
        if (course.address) {
          const cachedDriveTime = localStorage.getItem(locationCacheKey);
          if (cachedDriveTime) {
            course.driveTime = cachedDriveTime;
          } else {
            const driveTime = await this.distanceService.getDistance(location, course.address);
            localStorage.setItem(locationCacheKey, driveTime);
            course.driveTime = driveTime;
          }
        }
        return course;
      })
    );
  }

  getAllTeeTimes(params: TeeTimeSearchParams): Observable<TeeTime[]> {
    const {date} = params;
    return this.http.get<TeeTime[]>(`${this.apiUrl}/all`, {
      params: {date}
    }).pipe(
      map(teeTimes => this.filterPastTeeTimes(teeTimes))
    )
  }

  refreshAllTeeTimes(request: RefreshRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh/all`, request);
  }

  refreshCourseTeeTimes(courseId: number, request: RefreshRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh/${courseId}`, request);
  }

  filterPastTeeTimes(teeTimes: TeeTime[]): TeeTime[] {
    if (!teeTimes || !Array.isArray(teeTimes)) {
      return [];
    }

    const now = new Date();

    return teeTimes.filter(teeTime => {
      const teeTimeDate = new Date(teeTime.time);
      return teeTimeDate > now;
    });
  }

}
