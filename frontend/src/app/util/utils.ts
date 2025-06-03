import {Course} from "../model/models";
import moment from "moment/moment";

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

export function matchesHoles(teeTimeHoles: Array<number>, searchHoles: number): boolean {
  if (searchHoles === 10) {
    return true;
  }else{
    return teeTimeHoles.includes(searchHoles);
  }
}

export function isTimeInRange(teeTimeUtc: string, startTime: string, endTime: string): boolean {
  const format = 'HH:mm';
  const localTime = moment.utc(teeTimeUtc).local().format(format);
  const t = moment(localTime, format);
  const start = moment(startTime, format, true);
  const end = moment(endTime, format, true);

  if (!t.isValid() || !start.isValid() || !end.isValid()) {
    console.warn("Invalid time format detected", { teeTimeUtc, startTime, endTime });
    return false;
  }
  return t.isSameOrAfter(start) && t.isSameOrBefore(end);
}


