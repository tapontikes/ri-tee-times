import {Component, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {FormBuilder, FormGroup} from '@angular/forms';
import {Course} from "../../model/models";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  showSearch = true;
  searchForm: FormGroup;
  courses: Course[] = [];
  minDate = new Date();

  constructor(
    private fb: FormBuilder,
    private router: Router,
  ) {
    // Initialize form with default values
    this.searchForm = this.fb.group({
      date: [new Date()],
      startTime: ['06:00'],
      endTime: ['18:00'],
      holes: [18]
    });

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Hide search on course detail page
        this.showSearch = !event.url.includes('/course/');
      }
    });
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

    // Format the date as YYYY-MM-DD for API
    const date = this.formatDate(formValues.date);

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

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) {
      month = '0' + month;
    }
    if (day.length < 2) {
      day = '0' + day;
    }

    return [year, month, day].join('-'); // yyyy-MM-dd for API
  }

}
