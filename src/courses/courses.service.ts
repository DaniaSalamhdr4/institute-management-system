import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course, CourseDocument, CourseSchema } from './schemas/course.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>
  ) {}
  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    const createNewCourse = await this.courseModel.create(createCourseDto);
    return createNewCourse;
  }

  async findAll() : Promise<Course[]>{
    const courses =  await this.courseModel.find();
    return courses ;
  }

  async findOne(id: string): Promise<Course> {
    const course =  await this.courseModel.findById(id);
    if (!course) {
      throw new NotFoundException(`Course with ID "${id}" not found`);
    }
     return course as Course ;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    const updatedCourse = await this.courseModel
      .findByIdAndUpdate(id, updateCourseDto, { new: true }) 

    if (!updatedCourse) {
      throw new NotFoundException(`Course with ID "${id}" not found`);
    }

    return updatedCourse;
  }

  async remove(id: string): Promise<{ message: string; course: Course }>{
  const deletedCourse = await this.courseModel
      .findByIdAndDelete(id, { new: true }) 

    if (!deletedCourse) {
      throw new NotFoundException(`Course with ID "${id}" not found`);
    }

    return {message:"Course deleted successfully", course: deletedCourse as Course};
  }
}
