import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {SessionResponse, SessionStatus} from "../../model/models";
import * as moment from "moment-timezone";

@Injectable({
  providedIn: 'root'
})
export class ForeupSessionService {
  private readonly STORAGE_KEY = 'foreup_sessions';

  constructor(private http: HttpClient) {
  }

  /**
   * Check if a session exists and is valid for a specific course id
   * @param courseId The ForeUp courseId to check
   */
  checkSession(courseId: number): Observable<SessionStatus> {
    // First check local storage
    const storedSession = this.getStoredSession(courseId);

    // If we have a valid session in storage, use it
    if (storedSession && this.isSessionValid(storedSession)) {
      return of(storedSession);
    }

    // Otherwise check with the backend
    return this.http.get<SessionResponse>(`/api/foreup/session/${courseId}`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Failed to check session');
        }

        // Store the session in local storage
        this.storeSession(response.session);

        return response.session;
      }),
      catchError(error => {
        console.error('Error checking session status:', error);
        return of({
          isActive: false,
          expiresAt: null,
          courseName: courseId
        });
      })
    );
  }

  /**
   * Store a session in local storage
   * @param session The session to store
   */
  public storeSession(session: SessionStatus): void {
    const sessions = this.getAllStoredSessions();
    const id = session.id || 0;
    sessions[id] = session;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
  }

  public deleteSession(id: number): void {
    const sessions = this.getAllStoredSessions();

    if (sessions[id]) {
      delete sessions[id];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    }
  }

  /**
   * Get a stored session for a courseName
   * @param id The courseName to get session for
   */
  private getStoredSession(id: number): SessionStatus | null {
    const sessions = this.getAllStoredSessions();
    return sessions[id] || null;
  }

  /**
   * Get all stored sessions from local storage
   */
  private getAllStoredSessions(): { [id: number]: SessionStatus } {
    const sessionsJson = localStorage.getItem(this.STORAGE_KEY);
    return sessionsJson ? JSON.parse(sessionsJson) : {};
  }

  /**
   * Check if a session is still valid
   * @param session The session to check
   */
  private isSessionValid(session: SessionStatus): boolean {
    if (!session.isActive || !session.expiresAt) {
      return false;
    }

    // Compare with current time
    const expiryTime = moment(session.expiresAt);
    const now = moment();

    // Add a safety buffer (e.g., 5 minutes)
    return expiryTime.isAfter(now.add(5, 'minutes'));
  }
}
