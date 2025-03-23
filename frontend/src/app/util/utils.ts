import {Course} from "../model/models";

export function formatDate(date: Date): string {
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

  return [year, month, day].join('-');
}

export function bookWithCourse(bookingUrl: string) {
  window.open(bookingUrl, '_blank');
}

export function findCourseById(courses: Course[], id: number): Course {
  const course = courses.find(course => course.id === id);
  if (!course) {
    throw new Error('Course not found');
  }
  return course;
}


