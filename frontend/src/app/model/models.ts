// src/app/models/models.ts

export interface Course {
  id: number;
  name: string;
  request_data: CourseRequestData;
  type: string;
  provider: CourseProvider;
  teeTimes: TeeTime[];
  booking_url: string;
}

export interface CourseRequestData {
  course: string;

  [key: string]: any;
}

export enum CourseProvider {
  foreup = 'foreup',
  teesnap = 'teesnap',
  teeitup = 'teeitup',
  teewire = 'teewire'
}

export interface TeeTime {
  id: number;
  courseId: number;
  time: string;
  start: string
  holes: number[];
  spots: number;
}

export interface TeeTimeSearchParams {
  date: string;
  startTime?: string;
  endTime?: string;
  holes?: number
  players?: number;
}

export interface RefreshRequest {
  date: string;
}

export interface DialogData {
  course: Course;
  teeTime: TeeTime;
}
