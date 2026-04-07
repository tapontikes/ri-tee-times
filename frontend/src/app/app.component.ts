import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {NavbarComponent} from './layout/navbar/navbar.component';
import {Toast} from 'primeng/toast';

@Component({
  selector: 'app-root',
  template: `
    <app-navbar></app-navbar>
    <p-toast position="bottom-right"></p-toast>
    <router-outlet></router-outlet>`,
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, Toast],
})
export class AppComponent {
  title = 'Golf Tee Times';
}
