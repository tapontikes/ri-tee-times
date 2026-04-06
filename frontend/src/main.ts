import {bootstrapApplication} from '@angular/platform-browser';
import {provideRouter} from '@angular/router';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideNativeDateAdapter} from '@angular/material/core';
import {AppComponent} from './app/app.component';
import {appRoutes} from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
  ]
}).catch(err => console.error(err));
