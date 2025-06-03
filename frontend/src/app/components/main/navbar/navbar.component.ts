import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {FormBuilder, FormGroup} from '@angular/forms';
import {Course} from "../../../model/models";
import {formatDate} from "../../../util/utils";
import {DataSharingService} from "../../../service/data-sharing.service";
import moment from "moment";

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    standalone: false
})
export class NavbarComponent implements OnInit {
  showHamburger = true;
  showSearch = true;
  searchForm: FormGroup;
  courses: Course[] = [];
  minDate = moment().toDate();
  maxDate = moment().add(7, 'days').toDate();
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
    this.dataSharingService.clearSelectedData();

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
