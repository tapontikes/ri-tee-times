import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {Course, RefreshRequest, TeeTime, TeeTimeSearchParams} from '../../shared/models/models';
import {DistanceService} from './distance.service';
import {DataSharingService} from './data-sharing.service';

@Injectable({providedIn: 'root'})
export class TeeTimeService {

  private readonly apiUrl = '/api/tee-times';

  constructor(
    private http: HttpClient,
    private distanceService: DistanceService,
    private dataSharingService: DataSharingService
  ) {
  }

  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/courses`);
  }

  async mapCourseDrivingTime(courses: Course[], location: string): Promise<Course[]> {
    if (!location) return courses;
    localStorage.setItem('selectedAddress', location);
    return Promise.all(
      courses.map(async course => {
        if (!course.address) return course;
        const cacheKey = `${location}-${course.address}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) return {...course, driveTime: cached};
        const driveTime = await this.distanceService.getDistance(location, course.address);
        localStorage.setItem(cacheKey, driveTime);
        return {...course, driveTime};
      })
    );
  }

  getAllTeeTimes(params: TeeTimeSearchParams): Observable<TeeTime[]> {
    const httpParams: Record<string, string> = {date: params.date};
    if (params.holes === 9 || params.holes === 18) {
      httpParams['holes'] = String(params.holes);
    }
    return this.http.get<TeeTime[]>(`${this.apiUrl}/all`, {params: httpParams}).pipe(
      map(teeTimes => teeTimes.filter(t => new Date(t.time) > new Date()))
    );
  }

  getCourseTeeTimes(courseId: number, date: string): Observable<TeeTime[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${courseId}/${date}`).pipe(
      map(rows => rows.map(r => ({
        id: r.id,
        courseId: r.courseId ?? r.course_id,
        time: r.time ?? r.tee_time,
        holes: r.holes,
        spots: r.spots,
        start: r.start,
      })).filter(t => new Date(t.time) > new Date()))
    );
  }

  getLastRefreshed(date: string): Observable<Date | null> {
    return this.http.get<{ lastRefreshedAt: string | null }>(`${this.apiUrl}/last-refreshed`, {params: {date}}).pipe(
      map(r => r.lastRefreshedAt ? new Date(r.lastRefreshedAt) : null)
    );
  }

  refreshAllTeeTimes(request: RefreshRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh/all`, request);
  }

  refreshCourseTeeTimes(courseId: number, request: RefreshRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh/${courseId}`, request);
  }
}
