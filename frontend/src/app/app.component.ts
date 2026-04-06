import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {NavbarComponent} from './layout/navbar/navbar.component';

@Component({
  selector: 'app-root',
  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>`,
  standalone: true,
  imports: [RouterOutlet, NavbarComponent]
})
export class AppComponent {
  title = 'Golf Tee Times';
}
