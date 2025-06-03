import {Injectable} from '@angular/core';
import {Course, TeeTime} from "../model/models";
import {findCourseById} from "../util/utils";
import PlaceResult = google.maps.places.PlaceResult;

@Injectable({
  providedIn: 'root'
})
export class DataSharingService {
  private _teeTimes: TeeTime[] = [];
  private _courses: Course[] = [];
  private _selectedTeeTime!: TeeTime;
  private _selectedCourse!: Course;
  private _userLocation: string = "";

  constructor() {}

  setSelectedTeeTime(selectedTeeTime: TeeTime): void {
    this._selectedTeeTime = selectedTeeTime;
  }

  getSelectedTeeTime(): TeeTime {
    return <TeeTime>this._selectedTeeTime;
  }

  setSelectedCourse(selectedCourse: Course): void {
    this._selectedCourse = selectedCourse;
  }

  getSelectedCourse(): Course {
    return <Course>this._selectedCourse;
  }

  setTeeTimes(teeTimes: TeeTime[]): void {
    this._teeTimes = teeTimes;
  }

  getTeeTimes(): TeeTime[] {
    return this._teeTimes;
  }

  setCourses(courses: Course[]): void {
    this._courses = courses;
  }

  getCourses(): Course[] {
    return this._courses;
  }

  getCourseById(id: number): Course {
    return findCourseById(this._courses, id);
  }

  getTeeTimesByCourseId(courseId: number): TeeTime[] {
    return this._teeTimes.filter(teeTime => teeTime.courseId === courseId);
  }

  getUserLocation(): string {
    return this._userLocation;
  }

  setUserLocation(location: string){
    this._userLocation = location;
  }

  clearSelectedData() {
    this._selectedTeeTime = {} as TeeTime;
    this._selectedCourse = {} as Course;
  }
}
