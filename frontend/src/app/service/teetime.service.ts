import {Injectable, isDevMode} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {TeeTime} from "../model/teeTime";
import { environment } from '../../environments/environment';
import {Course, ForeupRequestData, TeesnapRequestData} from "../model/course";


@Injectable({
  providedIn: 'root'
})
export class TeeTimeService {

  private baseURL = window.location.protocol + '//' + window.location.host;

  private foreupRoute = "/foreup";

  private teesnapRoute = '/teesnap'

  private courseRoute = "/courses"

  constructor(private http: HttpClient) {
    if (isDevMode()) {
      this.baseURL = environment.api;
    }

  }

  getCourses(): Observable<Course[]>{
    return this.http.get<Course[]>(this.baseURL + this.courseRoute)
  }

  getTeeTimesForeup(data: ForeupRequestData): Observable<TeeTime[]> {
    return this.http.post<TeeTime[]>(this.baseURL + this.foreupRoute, data);
  }

  getTeeTimesTeesnap(data: TeesnapRequestData): Observable<TeeTime[]>{
    return this.http.post<TeeTime[]>(this.baseURL + this.teesnapRoute, data);
  }

}
