import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';

export const SourceGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  if (!router.navigated) {
    return router.parseUrl('/');
  }

  return true;
};
