import {Injectable} from '@angular/core';
import {Course, TeeTime} from '../../shared/models/models';
import {findCourseById} from '../../shared/utils';

export interface SearchState {
  date: string;
  preset: string;
  holes: number;
  startTime: string;
  endTime: string;
}

function defaultSearchState(): SearchState {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (new Date().getHours() >= 18) now.setDate(now.getDate() + 1);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return {date: `${now.getFullYear()}-${m}-${d}`, preset: 'all', holes: 10, startTime: '05:00', endTime: '23:59'};
}

@Injectable({providedIn: 'root'})
export class DataSharingService {
  private _teeTimes: TeeTime[] = [];
  private _courses: Course[] = [];
  private _selectedTeeTime!: TeeTime;
  private _selectedCourse!: Course;
  private _userLocation = '';
  private _searchState: SearchState = defaultSearchState();

  setSelectedTeeTime(teeTime: TeeTime): void {
    this._selectedTeeTime = teeTime;
  }

  getSelectedTeeTime(): TeeTime {
    return this._selectedTeeTime;
  }

  setSelectedCourse(course: Course): void {
    this._selectedCourse = course;
  }

  getSelectedCourse(): Course {
    return this._selectedCourse;
  }

  setTeeTimes(teeTimes: TeeTime[]): void {
    this._teeTimes = teeTimes;
  }

  getTeeTimes(): TeeTime[] {
    return this._teeTimes;
  }

  setCourses(courses: Course[]): void {
    this._courses = courses;
  }

  getCourses(): Course[] {
    return this._courses;
  }

  getCourseById(id: number): Course | undefined {
    return findCourseById(this._courses, id);
  }

  getTeeTimesByCourseId(courseId: number): TeeTime[] {
    return this._teeTimes.filter(t => t.courseId === courseId);
  }

  getUserLocation(): string {
    return this._userLocation;
  }

  setUserLocation(location: string): void {
    this._userLocation = location;
  }

  getSearchState(): SearchState {
    return {...this._searchState};
  }

  setSearchState(state: Partial<SearchState>): void {
    this._searchState = {...this._searchState, ...state};
  }

  clearSelectedData(): void {
    this._selectedTeeTime = {} as TeeTime;
    this._selectedCourse = {} as Course;
  }
}
