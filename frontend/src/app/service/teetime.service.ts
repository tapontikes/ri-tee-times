// src/app/services/tee-time.service.ts

import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {Course, RefreshRequest, TeeTime, TeeTimeSearchParams} from "../model/models";

@Injectable({
  providedIn: 'root'
})
export class TeeTimeService {
  private apiUrl = 'http://localhost:3000/api/tee-times';

  constructor(private http: HttpClient) {
  }

  // Get all available courses
  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/courses`);
  }

  // Get tee times for a specific course and date
  getCourseTeeTimes(courseId: number, params: TeeTimeSearchParams): Observable<TeeTime[]> {
    const {date, players, holes} = params;
    let url = `${this.apiUrl}/${courseId}/${date}`;

    // Add query parameters if provided
    const queryParams: any = {};
    if (players) queryParams.players = players;
    if (holes) queryParams.holes = holes;

    return this.http.get<TeeTime[]>(url, {params: queryParams}).pipe(
      catchError(error => {
        console.error('Error fetching course tee times:', error);
        return of([] as TeeTime[]); // Return empty array on error
      })
    );
  }

  // Get all tee times for a specific date
  getAllTeeTimes(params: TeeTimeSearchParams): Observable<TeeTime[]> {
    const {date} = params;
    return this.http.get<TeeTime[]>(`${this.apiUrl}/all`, {
      params: {date}
    });
  }

  // Refresh all tee times for a specific date
  refreshAllTeeTimes(request: RefreshRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh/all`, request);
  }

  // Refresh tee times for a specific course and date
  refreshCourseTeeTimes(courseId: number, request: RefreshRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh/${courseId}`, request);
  }
}
