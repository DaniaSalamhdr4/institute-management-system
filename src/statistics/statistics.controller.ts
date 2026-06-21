import { Controller, Get } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('students-per-course')
  getStudentsPerCourse() {
    return this.statisticsService.getStudentsPerCourse();
  }
  @Get('students-per-year')
  getStudentsPerYear() {
    return this.statisticsService.getStudentsPerYear();
  }
  @Get('course-success-rate')
  getCourseSuccessRate() {
    return this.statisticsService.getCourseSuccessRate();
  }
}
