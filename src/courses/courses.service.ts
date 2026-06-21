import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course, CourseDocument } from './schema/course.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schema/user.schema';
@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}
  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    if (createCourseDto.teacher_id) {
      const teacherExists = await this.userModel
        .findById(createCourseDto.teacher_id)
        .exec();
      if (!teacherExists) {
        throw new BadRequestException('Teacher does not exist!');
      }
    }
    const createNewCourse = await this.courseModel.create(createCourseDto);
    return createNewCourse;
  }

  async findAll(): Promise<Course[]> {
    const courses = await this.courseModel
      .find()
      .populate('teacher_id', 'name');
    return courses;
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.courseModel
      .findById(id)
      .populate('teacher_id', 'name');
    if (!course) {
      throw new NotFoundException(`Course with ID "${id}" not found`);
    }
    return course as Course;
  }

  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
  ): Promise<{ message: string; course: Course }> {
    const updatedCourse = await this.courseModel
      .findByIdAndUpdate(id, updateCourseDto, { new: true })
      .populate('teacher_id', 'name');

    if (!updatedCourse) {
      throw new NotFoundException(`Course with ID "${id}" not found`);
    }

    return {
      message: 'Course updated successfully',
      course: updatedCourse as Course,
    };
  }

  async remove(id: string): Promise<{ message: string; course: Course }> {
    const deletedCourse = await this.courseModel.findByIdAndDelete(id, {
      new: true,
    });

    if (!deletedCourse) {
      throw new NotFoundException(`Course with ID "${id}" not found`);
    }

    return {
      message: 'Course deleted successfully',
      course: deletedCourse as Course,
    };
  }
}
