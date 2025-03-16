// src/app/services/tee-time.teetimes.ts

import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {Course, RefreshRequest, TeeTime, TeeTimeSearchParams} from "../model/models";

@Injectable({
  providedIn: 'root'
})
export class TeeTimeService {

  private readonly apiUrl = window.location.protocol + '//' + window.location.host + "/api/tee-times";

  constructor(private http: HttpClient) {
  }

  // Get all available courses
  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/courses`);
  }

  getAllTeeTimes(params: TeeTimeSearchParams): Observable<TeeTime[]> {
    const {date} = params;
    return this.http.get<TeeTime[]>(`${this.apiUrl}/all`, {
      params: {date}
    }).pipe(
      map(teeTimes => this.filterPastTeeTimes(teeTimes))
    );
  }

// Update the getCourseTeeTimes method
  getCourseTeeTimes(courseId: number, params: TeeTimeSearchParams): Observable<TeeTime[]> {
    const {date, players, holes} = params;
    let url = `${this.apiUrl}/${courseId}/${date}`;

    // Add query parameters if provided
    const queryParams: any = {};
    if (players) queryParams.players = players;
    if (holes) queryParams.holes = holes;

    return this.http.get<TeeTime[]>(url, {params: queryParams}).pipe(
      map(teeTimes => this.filterPastTeeTimes(teeTimes)),
      catchError(error => {
        console.error('Error fetching course tee times:', error);
        return of([] as TeeTime[]); // Return empty array on error
      })
    );
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
