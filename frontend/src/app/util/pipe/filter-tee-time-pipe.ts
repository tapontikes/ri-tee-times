import {Pipe, PipeTransform} from '@angular/core';
import {Course, TeeTime, TeeTimeSearchParams} from '../../model/models';
import {isTimeInRange, matchesHoles} from "../utils";

@Pipe({ name: 'teeTimeFilter', pure: false })
export class FilterTeeTimePipe implements PipeTransform {
  transform(teeTimes: TeeTime[], searchParams: TeeTimeSearchParams, course: Course): TeeTime[] {
    if (!teeTimes || !searchParams) return teeTimes;
    return teeTimes.filter(t =>
    (t.courseId === course.id) &&
    matchesHoles(t.holes, searchParams.holes) &&
    isTimeInRange(t.time, searchParams.startTime, searchParams.endTime)
    );
  }
}
