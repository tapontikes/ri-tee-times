import {Component, OnInit} from '@angular/core';
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


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  public selectedCourse: Course = <Course>{};
  public dateRangeStart: number = 5;
  public dateRangeEnd: number = 19;
  public showAllCourses: boolean = false;
  public holeFilterValue: number = 1;
  public selectedDate: Date = moment().hour() >= 17 ? moment().add(1, 'day').toDate() : moment().toDate();
  public courses: Course[] = [];
  public loading = true;

  constructor(private teeTimeService: TeeTimeService) {
    Object.assign(this.courses, coursesJSON);
  }

  async ngOnInit() {
    await this.getCourses();
    await this.getTeeTimes();
    this.loading = false;
  }

  async getCourses() {
    this.selectedCourse = this.courses[Math.floor(Math.random() * this.courses.length)];
  }

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
      course.teeTimes = teeTimeData;
      return course;
    });
    await Promise.all(teeTimeMapPromises)
    this.loading = false;
  }

  async getForeUpTeeTimeData(course: Course) {
    let requestData = {} as ForeUpRequestData;

    Object.assign(requestData, course.requestData)
    requestData.date = this.formatDateForeUp();

    return await firstValueFrom(this.teeTimeService.getTeeTimesForeUp(requestData));
  }

  async getTeeSnapTeeTimeData(course: Course) {
    let requestData = {} as TeeSnapRequestData

    Object.assign(requestData, course.requestData);
    requestData.date = this.formatDateTeeSnapAndTeeItUp();

    return await firstValueFrom(this.teeTimeService.getTeeTimesTeeSnap(requestData))
  }

  async getTeeItUpTeeTimeData(course: Course) {
    let requestData = {} as TeeItUpRequestData

    Object.assign(requestData, course.requestData)
    requestData.date = this.formatDateTeeSnapAndTeeItUp();

    return await firstValueFrom(this.teeTimeService.getTeeTimesForTeeItUp(requestData));
  }

  async getTeeWireTeeTimeData(course: Course) {
    let requestData = {} as TeeWireRequestData

    Object.assign(requestData, course.requestData)
    requestData.date = this.formatDateTeeWire();

    return await firstValueFrom(this.teeTimeService.getTeeTimesForTeeWire(requestData));
  }

  async updateDateAndTeeTimes(event: Date) {
    this.loading = true;
    this.selectedDate = event;
    this.courses.map(course => course.teeTimes = []);
    await this.getTeeTimes();
  }

  async refreshTeeTimes() {
    this.loading = true;
    await this.getTeeTimes();
  }

  changeCourse(event: any) {
    const selectedCourse = this.courses.find((course) => course.name === event);
    if (selectedCourse) {
      this.selectedCourse = selectedCourse;
    }
  }

  formatSliderLabel(value: number): string {
    return moment().hour(value).minute(0).format("h:mma").toString();
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
}
