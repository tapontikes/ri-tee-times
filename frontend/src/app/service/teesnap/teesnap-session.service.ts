import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import moment from 'moment';
import {SessionResponse, SessionStatus} from "../../model/models";

@Injectable({
  providedIn: 'root'
})
export class TeesnapSessionService {
  private readonly STORAGE_KEY = 'teesnap_sessions';

  constructor(private http: HttpClient) {
  }

  /**
   * Check if a session exists and is valid for a specific domain
   * @param domain The TeesNap domain to check
   */
  checkSession(domain: string): Observable<SessionStatus> {
    // First check local storage
    const storedSession = this.getStoredSession(domain);

    // If we have a valid session in storage, use it
    if (storedSession && this.isSessionValid(storedSession)) {
      return of(storedSession);
    }

    // Otherwise check with the backend
    return this.http.get<SessionResponse>(`/api/teesnap/session/${encodeURIComponent(domain)}`).pipe(
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
          domain
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
    sessions[session.domain] = session;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
  }

  public deleteSession(domain: string): void {
    const sessions = this.getAllStoredSessions();

    if (sessions[domain]) {
      delete sessions[domain];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    }
  }

  /**
   * Get a stored session for a domain
   * @param domain The domain to get session for
   */
  private getStoredSession(domain: string): SessionStatus | null {
    const sessions = this.getAllStoredSessions();
    return sessions[domain] || null;
  }

  /**
   * Get all stored sessions from local storage
   */
  private getAllStoredSessions(): { [domain: string]: SessionStatus } {
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
