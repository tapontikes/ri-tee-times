import {Injectable} from '@angular/core';
import {Course, TeeTime} from "../model/models";
import {NotFound} from "http-errors";
import {findCourseById} from "../util/utils";

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

  getCourseById(id: number): Course {
    const course = findCourseById(this.courses, id);
    if (!course) {
      throw new NotFound(
        `Course with ID ${id} not found`);
    }
    return course;

  }

  getTeeTimesByCourseId(courseId: number): TeeTime[] {
    return this.teeTimes.filter(teeTime => teeTime.courseId === courseId);
  }
}
