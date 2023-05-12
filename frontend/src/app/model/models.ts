// Models and Tee Time Models

export interface Course {
  name: string;
  requestData: string;
  type: CourseType;
  teeTimes: TeeTime[];
  bookingUrl: string;
}

export enum CourseType {
  FOREUP = "foreup",
  TEESNAP = "teesnap",
  TEEITUP = "teeitup",
  TEEWIRE = "teewire"
}

export interface TeeTime {
  time: string;
  holes: number[];
  start: string;
  spots: string;

}

// Http Request Data Models
export interface ForeUpRequestData {
  courseName: string;
  id: string;
  booking_class: string;
  date: string;
}

export interface TeeSnapRequestData {
  courseName: string;
  baseUrl: string;
  date: string;
  course: string;
}

export interface TeeItUpRequestData {
  courseName: string;
  date: string;
  facilityIds: string;
  alias: string;
}

export interface TeeWireRequestData {
  courseName: string;
  date: string;
  controller: string;
  action: string;
  cid: string;
  cal_id: string;
  path: string;
}
