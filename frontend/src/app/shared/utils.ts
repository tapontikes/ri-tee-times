import {Course} from "./models/models";
import moment from "moment";

export function formatDate(date: Date): string {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function findCourseById(courses: Course[], id: number): Course | undefined {
  return courses.find(course => course.id === id);
}

export function matchesHoles(teeTimeHoles: number[], searchHoles: number): boolean {
  return searchHoles === 10 || teeTimeHoles.includes(searchHoles);
}

export function isTimeInRange(teeTimeUtc: string, startTime: string, endTime: string): boolean {
  const format = 'HH:mm';
  const localTime = moment.utc(teeTimeUtc).local().format(format);
  const t = moment(localTime, format);
  const start = moment(startTime, format, true);
  const end = moment(endTime, format, true);

  if (!t.isValid() || !start.isValid() || !end.isValid()) {
    console.warn("Invalid time format detected", {teeTimeUtc, startTime, endTime});
    return false;
  }
  return t.isSameOrAfter(start) && t.isSameOrBefore(end);
}

export function randomDelay(): number {
  return Math.floor(Math.random() * (300 - 200 + 1)) + 200;
}
