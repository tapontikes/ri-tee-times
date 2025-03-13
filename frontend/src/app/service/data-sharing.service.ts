import {Injectable} from '@angular/core';
import {Course, TeeTime} from "../model/models";

@Injectable({
  providedIn: 'root'
})
export class DataSharingService {
  private teeTimes: TeeTime[] = [];
  private courses: Course[] = [];

  constructor() {
  }

  setTeeTimes(teeTimes: TeeTime[]): void {
    this.teeTimes = teeTimes;
  }

  getTeeTimes(): TeeTime[] {
    return this.teeTimes;
  }

  setCourses(courses: Course[]): void {
    this.courses = courses;
  }

  getCourses(): Course[] {
    return this.courses;
  }

  getCourseById(id: number): Course | null {
    return this.courses.find(course => course.id === id) || null;
  }

  getTeeTimesByCourseId(courseId: number): TeeTime[] {
    return this.teeTimes.filter(teeTime => teeTime.courseId === courseId);
  }
}
