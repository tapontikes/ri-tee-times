// Models and Tee Time Models
export interface Course {
  name: string;
  requestData: string
  type: CourseType;
  teetimes: TeeTime[]
}

export enum CourseType {
  FOREUP = "foreup",
  TEESNAP = "teesnap"
}

export interface TeeTime {
  time: string;
  holes: number[];
  start: string;
  spots: string;

}

// Http Request Data Models
export interface ForeupRequestData {
  id: string;
  booking_class: string;
  date: string
}

export interface TeesnapRequestData {
  baseUrl: string;
  date: string;
  holes: string;
  players: string;
  course: string;
}
