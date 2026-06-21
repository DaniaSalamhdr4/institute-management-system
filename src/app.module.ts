import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { StatisticsModule } from './statistics/statistics.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/institute_db'),
    UsersModule,
    CoursesModule,
    AuthModule,
    StatisticsModule,
    EnrollmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
