// src/app/services/session.service.ts
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = '/api/auth';
  private localStorageKey = 'user_session';
  private sessionInitialized = false;

  constructor(private http: HttpClient) {
  }

  // Initialize session on app startup
  initializeSession(): Observable<any> {
    if (this.sessionInitialized) {
      return of(this.getSessionFromStorage());
    }

    return this.http.get<any>(`${this.apiUrl}/session`, {
      withCredentials: true
    }).pipe(
      tap(sessionData => {
        this.sessionInitialized = true;
        this.saveSessionToStorage(sessionData);
      }),
      catchError(error => {
        console.error('Error initializing session:', error);
        // If the GET fails, try to create a session with POST
        return this.createNewSession();
      })
    );
  }

  // Regular methods to get/update session
  getSession(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/session`, {
      withCredentials: true
    }).pipe(
      tap(sessionData => {
        this.saveSessionToStorage(sessionData);
      }),
      catchError(error => {
        console.error('Error fetching session:', error);
        return of(null);
      })
    );
  }

  updateSessionPreferences(preferences: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/session`, preferences, {
      withCredentials: true
    }).pipe(
      tap(response => {
        if (response.success) {
          const currentSession = this.getSessionFromStorage();
          if (currentSession) {
            currentSession.preferences = response.preferences;
            this.saveSessionToStorage(currentSession);
          }
        }
      }),
      catchError(error => {
        console.error('Error updating session preferences:', error);
        return of(null);
      })
    );
  }

  getSessionFromStorage(): any {
    const sessionData = localStorage.getItem(this.localStorageKey);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  clearSession(): void {
    localStorage.removeItem(this.localStorageKey);
    this.sessionInitialized = false;
  }

  private createNewSession(): Observable<any> {
    // Send an empty POST to create a new session
    return this.http.post<any>(`${this.apiUrl}/session`, {}, {
      withCredentials: true
    }).pipe(
      tap(response => {
        this.sessionInitialized = true;
        if (response) {
          this.saveSessionToStorage(response);
        }
      }),
      catchError(error => {
        console.error('Error creating new session:', error);
        return of(null);
      })
    );
  }

  private saveSessionToStorage(sessionData: any): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(sessionData));
  }
}
