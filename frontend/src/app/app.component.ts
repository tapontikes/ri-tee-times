import {Component, OnInit} from '@angular/core';
import {TeeTimeService} from "./service/teetime.service";
import {CourseType, ForeupRequestData, Models, TeesnapRequestData, TeeTime} from "./model/models";
import {firstValueFrom} from "rxjs";
import * as moment from 'moment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  public holeFilterValue: number = 0;
  public selectedCourse: Models = <Models>{};
  public selectedDate: Date = new Date();
  public courses: Models[] = [];
  public loading = true;

  constructor(private teeTimeService: TeeTimeService) {
  }

  async ngOnInit() {
    await this.getCourses();
    await this.getTeeTimes();
    this.loading = false;
  }

  async getCourses() {
    this.courses = [];
    this.courses = await firstValueFrom(this.teeTimeService.getCourses());
    this.selectedCourse = this.courses[Math.floor(Math.random() * this.courses.length)];
  }

  async getTeeTimes() {
    this.courses.map(async course => {
      let teeTimeData: TeeTime[] = [];

      switch (course.type) {
        case CourseType.FOREUP:
          teeTimeData = await this.getForeupTeetimeData(course)
          break;
        case CourseType.TEESNAP:
          teeTimeData = await this.getTeesnapTeetimeData(course);
          break;
      }
      course.teetimes = teeTimeData;
      return course;
    });
  }

  async getForeupTeetimeData(course: Models) {
    let requestData = {} as ForeupRequestData;

    Object.assign(requestData, course.requestData)
    requestData.date = this.formatDateForeup();

    return await firstValueFrom(this.teeTimeService.getTeeTimesForeup(requestData));
  }

  async getTeesnapTeetimeData(course: Models) {
    let requestData = {} as TeesnapRequestData

    Object.assign(requestData, course.requestData);
    requestData.date = this.formatDateTeesnap();
    requestData.players = "4";
    requestData.holes = "18";

    return await firstValueFrom(this.teeTimeService.getTeeTimesTeesnap(requestData))
  }

  updateDateAndTeeTimes(event: Date) {
    this.loading = true;
    this.selectedDate = event;
    this.courses.map(course => {
      course.teetimes = [];
      return course;
    })
    this.getTeeTimes();
    this.loading = false;
  }

  changeCourse(event: any) {
    const selectedCourse = this.courses.find((course) => course.name === event);
    if (selectedCourse) {
      this.selectedCourse = selectedCourse;
    }
  }

  bookTeeTime(url: String) {
    console.log(url);
  }

  formatDateForeup() {
    return moment(this.selectedDate).format('MM-DD-YYYY');
  }

  formatDateTeesnap() {
    return moment(this.selectedDate).format("YYYY-MM-DD");
  }
}
