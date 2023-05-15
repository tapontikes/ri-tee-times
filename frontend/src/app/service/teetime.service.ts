import {Injectable, isDevMode} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from '../../environments/environment';
import {ForeUpRequestData, TeeItUpRequestData, TeeSnapRequestData, TeeTime, TeeWireRequestData} from "../model/models";


@Injectable({
  providedIn: 'root'
})
export class TeeTimeService {

  private readonly baseURL = window.location.protocol + '//' + window.location.host;

  private foreUpRoute = "/foreup";

  private teeSnapRoute = '/teesnap';

  private teeItUpRoute = '/teeitup';

  private teeWireRoute = '/teewire';

  constructor(private http: HttpClient) {
    if (isDevMode()) {
      this.baseURL = environment.api;
    }

  }

  pollServer(): Observable<string> {
    return this.http.get<string>(this.baseURL)
  }

  getTeeTimesForeUp(data: ForeUpRequestData): Observable<TeeTime[]> {
    return this.http.post<TeeTime[]>(this.baseURL + this.foreUpRoute, data);
  }

  getTeeTimesTeeSnap(data: TeeSnapRequestData): Observable<TeeTime[]> {
    return this.http.post<TeeTime[]>(this.baseURL + this.teeSnapRoute, data);
  }

  getTeeTimesForTeeItUp(data: TeeItUpRequestData): Observable<TeeTime[]> {
    return this.http.post<TeeTime[]>(this.baseURL + this.teeItUpRoute, data);
  }

  getTeeTimesForTeeWire(data: TeeWireRequestData): Observable<TeeTime[]> {
    return this.http.post<TeeTime[]>(this.baseURL + this.teeWireRoute, data);
  }

}
