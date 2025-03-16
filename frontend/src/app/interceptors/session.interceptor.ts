// src/app/interceptors/session.interceptor.ts
import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable()
export class SessionInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Clone the request and add withCredentials option
    const clonedRequest = req.clone({
      withCredentials: true
    });

    return next.handle(clonedRequest);
  }
}
