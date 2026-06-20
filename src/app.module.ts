import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { EnrollmentsModule } from './enrollments/enrollments.module';
// import { UsersModule } from '../users/users.module'; 
// import { CoursesModule } from '../courses/courses.module'; 

@Module({
  imports: [MongooseModule.forRoot(
      'mongodb://localhost:27017/institute_db',
    ), EnrollmentsModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
