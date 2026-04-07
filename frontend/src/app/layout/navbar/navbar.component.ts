import {Component, DestroyRef, HostListener, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {NavigationEnd, Router, RouterModule} from '@angular/router';
import {filter} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {CommonModule} from '@angular/common';
import {DatePickerModule} from 'primeng/datepicker';
import {SelectButtonModule} from 'primeng/selectbutton';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
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
    DatePickerModule,
    SelectButtonModule,
    ButtonModule,
    InputTextModule,
  ],
})
export class NavbarComponent implements OnInit {
  searchForm: FormGroup;
  courses: Course[] = [];
  minDate = new Date();
  maxDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  isMobile = false;
  showMobileMenu = false;
  isCoursePage = false;

  private readonly destroyRef = inject(DestroyRef);

  holesOptions = [
    {label: '9', value: 9},
    {label: '18', value: 18},
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private dataSharingService: DataSharingService,
  ) {
    this.searchForm = this.fb.group({
      date: [new Date()],
      startTime: ['06:00'],
      endTime: ['18:00'],
      holes: [9],
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

    this.isCoursePage = this.router.url.startsWith('/course');
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((e: NavigationEnd) => {
      this.isCoursePage = e.urlAfterRedirects.startsWith('/course');
      if (this.isCoursePage) this.showMobileMenu = false;
    });
  }

  search(): void {
    const {date, startTime, endTime, holes} = this.searchForm.value;
    this.dataSharingService.clearSelectedData();
    this.router.navigate(['/teetimes'], {
      queryParams: {date: formatDate(date), startTime, endTime, holes},
    });
  }
}
