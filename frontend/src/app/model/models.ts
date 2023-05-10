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
  TEEITUP = "teeitup"
}

export interface TeeTime {
  time: string;
  holes: number[];
  start: string;
  spots: string;

}

// Http Request Data Models
export interface ForeUpRequestData {
  id: string;
  booking_class: string;
  date: string;
}

export interface TeeSnapRequestData {
  baseUrl: string;
  date: string;
  course: string;
}

export interface TeeItUpRequestData {
  date: string;
  facilityIds: string;
  alias: string;
}
