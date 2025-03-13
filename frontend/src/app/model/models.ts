// src/app/models/models.ts

export interface Course {
  id: number;
  name: string;
  request_data: string;
  type: string;
  teeTimes: TeeTime[];
  booking_url: string;
}

export interface TeeTime {
  id: number;
  courseId: number;
  time: string;
  holes: number[];
  spots: number;
}

export interface TeeTimeSearchParams {
  date: string;
  startTime?: string;
  endTime?: string;
  holes?: number | null
  players?: number;
}

export interface RefreshRequest {
  date: string;
}
