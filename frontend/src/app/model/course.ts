import {TeeTime} from "./teeTime";

export interface Course {
  name: string;
  requestData: string
  type: CourseType;
  teetimes: TeeTime[]
}
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

export enum CourseType {
  FOREUP = "foreup",
  TEESNAP = "teesnap"
}
