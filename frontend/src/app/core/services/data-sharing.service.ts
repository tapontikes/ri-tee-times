import {Injectable} from '@angular/core';
import {Course, TeeTime} from '../../shared/models/models';
import {findCourseById} from '../../shared/utils';

@Injectable({providedIn: 'root'})
export class DataSharingService {
  private _teeTimes: TeeTime[] = [];
  private _courses: Course[] = [];
  private _selectedTeeTime!: TeeTime;
  private _selectedCourse!: Course;
  private _userLocation = '';

  setSelectedTeeTime(teeTime: TeeTime): void {
    this._selectedTeeTime = teeTime;
  }

  getSelectedTeeTime(): TeeTime {
    return this._selectedTeeTime;
  }

  setSelectedCourse(course: Course): void {
    this._selectedCourse = course;
  }

  getSelectedCourse(): Course {
    return this._selectedCourse;
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

  getCourseById(id: number): Course | undefined {
    return findCourseById(this._courses, id);
  }

  getTeeTimesByCourseId(courseId: number): TeeTime[] {
    return this._teeTimes.filter(t => t.courseId === courseId);
  }

  getUserLocation(): string {
    return this._userLocation;
  }

  setUserLocation(location: string): void {
    this._userLocation = location;
  }

  clearSelectedData(): void {
    this._selectedTeeTime = {} as TeeTime;
    this._selectedCourse = {} as Course;
  }
}
