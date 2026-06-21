import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
// ملاحظة: يفترض وجود حارس JwtAuthGuard للتأكد من تسجيل الدخول أولاً
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard) // تشغيل حارس التحقق وحارس الصلاحيات معاً
@Roles('admin')
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
