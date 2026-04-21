import {APP_INITIALIZER} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';
import {provideRouter, withInMemoryScrolling} from '@angular/router';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {ErrorInterceptor} from './app/core/interceptors/error.interceptor';
import {providePrimeNG} from 'primeng/config';
import {definePreset} from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import {MessageService} from 'primeng/api';
import {DialogService} from 'primeng/dynamicdialog';
import {AppComponent} from './app/app.component';
import {appRoutes} from './app/app.routes';
import {LaunchDarklyService} from './app/core/services/launchdarkly.service';

const GolfPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#e8f5e9',
      100: '#c8e6c9',
      200: '#a5d6a7',
      300: '#81c784',
      400: '#66bb6a',
      500: '#2e7d32',
      600: '#276b2b',
      700: '#1b5e20',
      800: '#155219',
      900: '#0f3d12',
      950: '#082109',
    },
  },
});

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes, withInMemoryScrolling({scrollPositionRestoration: 'top'})),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: GolfPreset,
        options: {darkModeSelector: 'none'},
      },
    }),
    MessageService,
    DialogService,
    {provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true},
    {
      provide: APP_INITIALIZER,
      useFactory: (ld: LaunchDarklyService) => () => ld.initialize(),
      deps: [LaunchDarklyService],
      multi: true,
    },
  ],
}).catch(err => console.error(err));
