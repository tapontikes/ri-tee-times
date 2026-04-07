import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {MessageService} from 'primeng/api';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private messageService: MessageService) {
  }

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        const message = this.friendlyMessage(err);
        this.messageService.add({severity: 'error', summary: message, life: 6000});
        return throwError(() => err);
      }),
    );
  }

  private friendlyMessage(err: HttpErrorResponse): string {
    if (err.status === 0) return 'Cannot reach the server. Check your connection.';
    if (err.status === 503) return 'Database is temporarily unavailable. Please try again shortly.';
    if (err.status >= 500) return 'Server error. Please try again.';
    if (err.status === 404) return 'Requested data not found.';
    if (err.status === 401 || err.status === 403) return 'Not authorized.';
    return err.error?.error?.message ?? 'An unexpected error occurred.';
  }
}
