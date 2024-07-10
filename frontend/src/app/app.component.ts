import {Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {TeeTimeService} from "./service/teetime.service";
import {
  Course,
  CourseType,
  ForeUpRequestData,
  TeeItUpRequestData,
  TeeSnapRequestData,
  TeeTime,
  TeeWireRequestData
} from "./model/models";
import {firstValueFrom} from "rxjs";
import * as moment from 'moment';
import * as coursesJSON from './model/courses.json';
import {MatChipListbox, MatChipListboxChange} from "@angular/material/chips";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('chipListBox') chipListBox!: MatChipListbox;
  @ViewChildren('teeTimeCardContainerAll') teeTimeCardsWrappers!: QueryList<ElementRef>;

  // NgIf
  public loading = true;
  public showAllCourses: boolean = false;

  // Data
  public selectedCourse: Course = <Course>{};
  public courses: Course[] = [];

  // Filter by 9 or 18 holes (1 for both)
  public holeFilterValue: number = 1;

  // Tee Time Filter Date/Times
  public selectedDate!: Date;
  public timeFilterStart!: Date;
  public timeFilterEnd!: Date;
  public today: string = moment().utcOffset('+0000').format('YYYY-MM-DD');


  constructor(private teeTimeService: TeeTimeService) {
    Object.assign(this.courses, coursesJSON);
    this.selectedDate = moment().hour() >= 17 ? moment().add(1, 'day').toDate() : moment().toDate();
    this.timeFilterStart = moment(this.selectedDate).hour(5).minute(0).toDate();
    this.timeFilterEnd = moment(this.selectedDate).hour(18).minute(0).toDate();
  }

  async ngOnInit() {
    this.selectedCourse = this.courses[Math.floor(Math.random() * this.courses.length)];
    await this.getTeeTimes();
    this.loading = false;
  }

  // Map the course's teeTime[] field with an array of teeTimes[]
  async getTeeTimes() {
    const teeTimeMapPromises = this.courses.map(async course => {
      let teeTimeData: TeeTime[] = [];
      switch (course.type) {
        case CourseType.FOREUP:
          teeTimeData = await this.getForeUpTeeTimeData(course)
          break;
        case CourseType.TEESNAP:
          teeTimeData = await this.getTeeSnapTeeTimeData(course);
          break;
        case CourseType.TEEITUP:
          teeTimeData = await this.getTeeItUpTeeTimeData(course);
          break;
        case CourseType.TEEWIRE:
          teeTimeData = await this.getTeeWireTeeTimeData(course);
          break;
      }
      course.teeTimes = teeTimeData ? teeTimeData : [];
      return course;
    });
    await Promise.all(teeTimeMapPromises)
    this.courses.sort((a, b) => a.teeTimes.length - b.teeTimes.length);
    this.loading = false;
  }

  async updateDateAndTeeTimes(event: Date) {
    this.loading = true;
    this.selectedDate = event;
    this.timeFilterStart = moment(event).hour(5).minute(0).toDate();
    this.timeFilterEnd = moment(event).hour(18).minute(0).toDate();
    this.courses.map(course => course.teeTimes = []);
    await this.getTeeTimes();
  }

  async refreshTeeTimes() {
    this.loading = true;
    await this.getTeeTimes();
  }

  bookTeeTime(url: string) {
    window.open(url, "_blank");
  }

  formatDateSlider(time: number) {
    return moment(this.selectedDate).hour(time).minute(0).format("h:mma");
  }

  formatDateForeUp() {
    return moment(this.selectedDate).format('MM-DD-YYYY');
  }

  formatDateTeeWire() {
    return moment(this.selectedDate).format('MM/DD/YYYY');
  }

  formatDateTeeSnapAndTeeItUp() {
    return moment(this.selectedDate).format("YYYY-MM-DD");
  }

  formatCacheString(str: string) {
    return str.replace(/ /g, "_");
  }

  holeFilterChanged(changes: MatChipListboxChange) {
    if (!changes.value) {
      this.holeFilterValue = 1;
      this.chipListBox.value = 1;
    }
  }

  scrollLeft(index: number) {
    const element = this.teeTimeCardsWrappers.toArray()[index].nativeElement.querySelector('.tee-time-card-container-all');
    if (element) {
      element.scrollBy({left: -400, behavior: 'smooth'});
    }
  }

  scrollRight(index: number) {
    const element = this.teeTimeCardsWrappers.toArray()[index].nativeElement.querySelector('.tee-time-card-container-all');
    if (element) {
      element.scrollBy({left: 400, behavior: 'smooth'});
    }
  }

  showAllCourse() {
    this.showAllCourses = !this.showAllCourses;
  }

  // Function to call
  private async getForeUpTeeTimeData(course: Course) {
    let requestData = {} as ForeUpRequestData;

    Object.assign(requestData, course.requestData)
    requestData.courseName = this.formatCacheString(course.name);
    requestData.date = this.formatDateForeUp();

    return await firstValueFrom(this.teeTimeService.getTeeTimesForeUp(requestData));
  }

  private async getTeeSnapTeeTimeData(course: Course) {
    let requestData = {} as TeeSnapRequestData

    Object.assign(requestData, course.requestData);
    requestData.courseName = this.formatCacheString(course.name);
    requestData.date = this.formatDateTeeSnapAndTeeItUp();

    return await firstValueFrom(this.teeTimeService.getTeeTimesTeeSnap(requestData))
  }

  private async getTeeItUpTeeTimeData(course: Course) {
    let requestData = {} as TeeItUpRequestData

    Object.assign(requestData, course.requestData)
    requestData.courseName = this.formatCacheString(course.name);
    requestData.date = this.formatDateTeeSnapAndTeeItUp();

    return await firstValueFrom(this.teeTimeService.getTeeTimesForTeeItUp(requestData));
  }

  private async getTeeWireTeeTimeData(course: Course) {
    let requestData = {} as TeeWireRequestData

    Object.assign(requestData, course.requestData)
    requestData.courseName = this.formatCacheString(course.name);
    requestData.date = this.formatDateTeeWire();

    return await firstValueFrom(this.teeTimeService.getTeeTimesForTeeWire(requestData));
  }
}
