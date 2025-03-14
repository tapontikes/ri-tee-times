import {Component, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {FormBuilder, FormGroup} from '@angular/forms';
import {Course} from "../../model/models";
import {formatDate} from "../../util/utils";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  showHamburger = true;
  showSearch = true;
  searchForm: FormGroup;
  courses: Course[] = [];
  minDate = new Date();
  isMobile = false;
  showMobileMenu = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
  ) {
    this.searchForm = this.fb.group({
      date: [new Date()],
      startTime: ['06:00'],
      endTime: ['18:00'],
      holes: [9]
    });

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showSearch = !event.url.includes('/course/');
        this.showHamburger = !event.url.includes('/course/');
        this.showMobileMenu = false;
      }
    });

    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

// Add these methods
  checkScreenSize(): void {
    this.isMobile = window.innerWidth < 960;
    // Hide mobile menu when resizing to desktop
    if (!this.isMobile) {
      this.showMobileMenu = false;
    }
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }


  ngOnInit(): void {
    // Default to next day if after 5pm
    const now = new Date();
    if (now.getHours() >= 17) {  // 5pm or later
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.searchForm.get('date')?.setValue(tomorrow);
    }
  }


  search(): void {
    const formValues = this.searchForm.value;

    const date = formatDate(formValues.date);

    // Navigate to the main page with query parameters
    this.router.navigate([''], {
      queryParams: {
        date,
        startTime: formValues.startTime,
        endTime: formValues.endTime,
        holes: formValues.holes
      }
    });
  }

}
