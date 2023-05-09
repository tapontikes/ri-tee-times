import {Component, OnInit} from '@angular/core';
import {TeeTimeService} from "./service/teetime.service";
import {Course, CourseType, ForeupRequestData, TeesnapRequestData, TeeTime} from "./model/models";
import {firstValueFrom} from "rxjs";
import * as moment from 'moment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  public selectedCourse: Course = {
    name: "",
    requestData: "",
    type: CourseType.FOREUP,
    teeTimes: []
  };

  public holeFilterValue: number = 1;
  public selectedDate: Date = new Date();
  public courses: Course[] = [];
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
    const teeTimeMapPromises = this.courses.map(async course => {
      let teeTimeData: TeeTime[] = [];
      switch (course.type) {
        case CourseType.FOREUP:
          teeTimeData = await this.getForeUpTeeTimeData(course)
          break;
        case CourseType.TEESNAP:
          teeTimeData = await this.getTeeSnapTeeTimeData(course);
          break;
      }
      course.teeTimes = teeTimeData;
      return course;
    });
    await Promise.all(teeTimeMapPromises)
    this.loading = false;
  }

  async getForeUpTeeTimeData(course: Course) {
    let requestData = {} as ForeupRequestData;

    Object.assign(requestData, course.requestData)
    requestData.date = this.formatDateForeUp();

    return await firstValueFrom(this.teeTimeService.getTeeTimesForeUp(requestData));
  }

  async getTeeSnapTeeTimeData(course: Course) {
    let requestData = {} as TeesnapRequestData

    Object.assign(requestData, course.requestData);
    requestData.date = this.formatDateTeeSnap();
    requestData.players = "4";
    requestData.holes = "18";

    return await firstValueFrom(this.teeTimeService.getTeeTimesTeeSnap(requestData))
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

  bookTeeTime(url: String) {
    console.log(url);
  }

  formatDateForeUp() {
    return moment(this.selectedDate).format('MM-DD-YYYY');
  }

  formatDateTeeSnap() {
    return moment(this.selectedDate).format("YYYY-MM-DD");
  }
}
