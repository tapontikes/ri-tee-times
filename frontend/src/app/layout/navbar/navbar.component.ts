import {Component, HostListener, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {Course} from '../../shared/models/models';
import {formatDate} from '../../shared/utils';
import {DataSharingService} from '../../core/services/data-sharing.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatIconModule,
    MatButtonToggleModule,
  ]
})
export class NavbarComponent implements OnInit {
  searchForm: FormGroup;
  courses: Course[] = [];
  minDate = new Date();
  maxDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  isMobile = false;
  showMobileMenu = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private dataSharingService: DataSharingService,
  ) {
    this.searchForm = this.fb.group({
      date: [new Date()],
      startTime: ['06:00'],
      endTime: ['18:00'],
      holes: [9]
    });
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  checkScreenSize(): void {
    this.isMobile = window.innerWidth < 960;
    if (!this.isMobile) this.showMobileMenu = false;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  ngOnInit(): void {
    const now = new Date();
    if (now.getHours() >= 17) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.searchForm.get('date')?.setValue(tomorrow);
    }
  }

  search(): void {
    const {date, startTime, endTime, holes} = this.searchForm.value;
    this.dataSharingService.clearSelectedData();
    this.router.navigate([''], {
      queryParams: {date: formatDate(date), startTime, endTime, holes}
    });
  }
}
