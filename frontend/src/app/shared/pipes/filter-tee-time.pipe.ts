import {Pipe, PipeTransform} from '@angular/core';
import {Course, TeeTime, TeeTimeSearchParams} from '../models/models';
import {isTimeInRange, matchesHoles, matchesStart} from '../utils';

@Pipe({name: 'teeTimeFilter', standalone: true, pure: false})
export class FilterTeeTimePipe implements PipeTransform {
  transform(teeTimes: TeeTime[], searchParams: TeeTimeSearchParams, course: Course, startFilter: string | null = null): TeeTime[] {
    if (!teeTimes || !searchParams) return teeTimes;
    return teeTimes.filter(t =>
      t.courseId === course.id &&
      matchesHoles(t.holes, searchParams.holes) &&
      isTimeInRange(t.time, searchParams.startTime, searchParams.endTime) &&
      matchesStart(t.start, startFilter)
    );
  }
}
