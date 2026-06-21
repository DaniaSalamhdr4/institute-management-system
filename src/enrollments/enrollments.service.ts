import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Enrollment, EnrollmentDocument } from './schema/enrollments.schema';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { User } from '../users/schema/user.schema';
import { Course, CourseDocument } from '../courses/schema/course.schema';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
  ) {}

  //Create New
  async create(createEnrollmentDto: CreateEnrollmentDto): Promise<Enrollment> {
    const { student_id, course_id } = createEnrollmentDto;

    const student = await this.userModel.findById(student_id);
    if (!student) {
      throw new NotFoundException('Student noy exist');
    }
    if (student.role !== 'STUDENT') {
      throw new BadRequestException('Invalid , User not student');
    }

    const Course = await this.courseModel.findById(course_id);
    if (!Course) {
      throw new NotFoundException('Course not exist');
    }

    const existingEnrollment = await this.enrollmentModel.findOne({
      student_id,
      course_id,
    });
    if (existingEnrollment) {
      throw new BadRequestException('Student already in course (Enrollment)');
    }

    const newEnrollment = new this.enrollmentModel({
      student_id: new Types.ObjectId(student_id),
      course_id: new Types.ObjectId(course_id),
      grade: createEnrollmentDto.grade,
    });

    return await newEnrollment.save();
  }

  //Get all Recourds
  async findAll(): Promise<Enrollment[]> {
    try {
      return this.enrollmentModel
        .find()
        .populate('student_id')
        .populate('course_id')
        .exec();
    } catch (error) {
      console.error('Error Get All :', (error as any).message);
      return [];
    }
  }

  // Get All Courses For One Student
  async findByStudent(studentId: string): Promise<Enrollment[]> {
    return this.enrollmentModel
      .find({ student_id: new Types.ObjectId(studentId) })
      .populate('course_id')
      .exec();
  }

  // Update Grade
  async updateGrade(id: string, grade: number): Promise<Enrollment> {
    const enrollment = await this.enrollmentModel.findByIdAndUpdate(
      id,
      { grade },
      { new: true },
    );
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }
    return enrollment;
  }

  // Delete
  async remove(id: string): Promise<any> {
    const result = await this.enrollmentModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Enrollment not Exist');
    }
    return { message: 'Enrollment deleted successfuly' };
  }
}
