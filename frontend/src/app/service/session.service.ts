import {Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {map, Observable, of} from 'rxjs';
import moment from 'moment';
import {Session} from "../model/models";

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  private STORAGE_KEY: string = 'session';

  constructor(private http: HttpClient) {
  }

  checkSession(courseId: number, provider: string): Observable<Session | null> {
    const storedSession = this.getStoredSession(courseId);

    if (storedSession && this.isSessionValid(storedSession)) {
      return of(storedSession);
    }
    return this.http.get<Session>(`/api/${provider}/session/${courseId}`).pipe(
      map(session => {
        if (this.isSessionValid(session)) {
          this.storeSession(session);
          return session;
        } else {
          this.deleteSession(courseId);
          return null;
        }
      }),
    );
  }

  /**
   * Store a session in local storage
   * @param session The session to store
   */
  public storeSession(session: Session): void {
    const sessions = this.getAllStoredSessions();
    sessions[session.id] = session;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
  }

  public deleteSession(courseId: number): void {
    const sessions = this.getAllStoredSessions();

    if (sessions[courseId]) {
      delete sessions[courseId];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    }
  }

  /**
   * Get a stored session for a courseId
   * @param courseId The courseId to get session for
   */
  private getStoredSession(courseId: number): Session | null {
    const sessions = this.getAllStoredSessions();
    return sessions[courseId] || null;
  }

  /**
   * Get all stored sessions from local storage
   */
  private getAllStoredSessions(): { [courseId: string]: Session } {
    const sessionsJson = localStorage.getItem(this.STORAGE_KEY);
    return sessionsJson ? JSON.parse(sessionsJson) : {};
  }

  /**
   * Check if a session is still valid
   * @param session The session to check
   */
  private isSessionValid(session: Session): boolean {
    const expiryTime = moment(session.expiresAt);
    const now = moment();
    return expiryTime.isAfter(now.add(5, 'minutes'));
  }
}
