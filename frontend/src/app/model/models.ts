// src/app/models/models.ts

export interface Course {
  id: number;
  name: string;
  request_data: CourseRequestData;
  type: string;
  provider: CourseProvider;
  booking_url: string;
  address: string;
  driveTime: string;
}

export interface CourseRequestData {
  course: string;
  baseUrl: string;
  booking_class: string;
  id: string;

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
  startTime: string;
  endTime: string;
  holes: number;
  players?: number;
}

export interface RefreshRequest {
  date: string;
}

export interface DialogData {
  course: Course;
  teeTime: TeeTime;
}

export interface Session {
  expiresIn: number;
  expiresAt: string;
  id: number;
  jwt?: string;
}

