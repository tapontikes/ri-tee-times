import {Pipe, PipeTransform} from '@angular/core';
import {Course, TeeTime, TeeTimeSearchParams} from '../models/models';
import {isTimeInRange, matchesHoles} from '../utils';

@Pipe({name: 'courseFilter', standalone: true, pure: false})
export class FilterCoursePipe implements PipeTransform {
  transform(courses: Course[], teeTimes: TeeTime[], searchParams: TeeTimeSearchParams): Course[] {
    if (!teeTimes || !searchParams) return [];
    return courses.filter(course =>
      teeTimes.some(t =>
        t.courseId === course.id &&
        isTimeInRange(t.time, searchParams.startTime, searchParams.endTime) &&
        matchesHoles(t.holes, searchParams.holes)
      )
    );
  }
}
