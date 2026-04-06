import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable, of} from 'rxjs';
import {Session} from '../../shared/models/models';

@Injectable({providedIn: 'root'})
export class SessionService {

  private readonly STORAGE_KEY = 'session';

  constructor(private http: HttpClient) {
  }

  checkSession(courseId: number, provider: string): Observable<Session | null> {
    const stored = this.getStoredSession(courseId);
    if (stored && this.isSessionValid(stored)) return of(stored);

    return this.http.get<Session>(`/api/${provider}/session/${courseId}`).pipe(
      map(session => {
        if (this.isSessionValid(session)) {
          this.storeSession(session);
          return session;
        }
        this.deleteSession(courseId);
        return null;
      })
    );
  }

  storeSession(session: Session): void {
    const sessions = this.getAllStoredSessions();
    sessions[session.id] = session;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
  }

  deleteSession(courseId: number): void {
    const sessions = this.getAllStoredSessions();
    if (sessions[courseId]) {
      delete sessions[courseId];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    }
  }

  private getStoredSession(courseId: number): Session | null {
    return this.getAllStoredSessions()[courseId] ?? null;
  }

  private getAllStoredSessions(): { [courseId: string]: Session } {
    const json = localStorage.getItem(this.STORAGE_KEY);
    return json ? JSON.parse(json) : {};
  }

  private isSessionValid(session: Session): boolean {
    return new Date(session.expiresAt).getTime() > Date.now() + 5 * 60 * 1000;
  }
}
