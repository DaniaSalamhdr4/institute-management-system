import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Enrollment } from '../enrollments/schema/enrollments.schema';
import { Model } from 'mongoose';
import { User } from '../users/schema/user.schema';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<Enrollment>,
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}
  // get number of students was enrollement in course
  getStudentsPerCourse() {
    return this.enrollmentModel.aggregate([
      {
        $group: {
          _id: '$course_id',
          studentsCount: {
            $sum: 1,
          },
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course',
        },
      },
      {
        $unwind: '$course',
      },
      {
        $project: {
          _id: 0,
          courseName: '$course.course_name',
          studentsCount: 1,
        },
      },
    ]);
  }
  // get number of stubents per year
  getStudentsPerYear() {
    return this.userModel.aggregate([
      {
        $match: {
          role: 'STUDENT',
        },
      },
      {
        $group: {
          _id: '$registration_year',
          studentsCount: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
  }
  // get success rate for course
  getCourseSuccessRate() {
    return this.enrollmentModel.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'course_id',
          foreignField: '_id',
          as: 'course',
        },
      },
      {
        $unwind: '$course',
      },
      {
        $group: {
          _id: '$course_id',

          courseName: {
            $first: '$course.course_name',
          },

          totalStudents: {
            $sum: 1,
          },

          passedStudents: {
            $sum: {
              $cond: [
                {
                  $gte: ['$grade', '$course.passing_grade'],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          courseName: 1,
          totalStudents: 1,
          passedStudents: 1,

          successRate: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: ['$passedStudents', '$totalStudents'],
                  },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
    ]);
  }
}
