import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Enrollment } from './schemas/enrollments.schema';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
  ) {}

  //Create New Student
  async create(createEnrollmentDto: CreateEnrollmentDto): Promise<Enrollment> {
    const { student_id, course_id, grade } = createEnrollmentDto;

    const existing = await this.enrollmentModel.findOne({
      student_id: new Types.ObjectId(student_id),
      course_id: new Types.ObjectId(course_id),
    });

    if (existing) {
      throw new BadRequestException('Student is exist');
    }

    // 2. تمرير الـ grade هنا لحفظها في قاعدة البيانات (وإذا لم تُرسل ستأخذ القيمة null تلقائياً)
    const newEnrollment = new this.enrollmentModel({
      student_id: new Types.ObjectId(student_id),
      course_id: new Types.ObjectId(course_id),
      grade: grade !== undefined ? grade : null,
    });

    return await newEnrollment.save();
  }

  //Get All Student
  async findAll() {
    try {
      return await this.enrollmentModel
        .find()
        // .populate({ path: 'student_id', select: 'name email', strictPopulate: false })
        // .populate({ path: 'course_id', select: 'course_name passing_grade', strictPopulate: false })
        .exec();
    } catch (error) {
      console.error('Error Get All :', (error as any).message);
      return [];
    }
  }

  // 2. جلب جميع التسجيلات وعرض كافة المعلومات المتعلقة بالطلاب والدورات بأمان
  // async findAll() {
  //   try {
  //     const data = await this.enrollmentModel
  //       .find()
  //       .populate({ path: 'student_id', select: 'name email', strictPopulate: false })
  //       .populate({ path: 'course_id', select: 'course_name passing_grade', strictPopulate: false })
  //       .exec();

  //     // نقوم بعمل فلترة لإرجاع التسجيلات التي تحتوي على كائنات سليمة فقط وتخطي البيانات القديمة التالفة
  //     return data.filter(item => item && item.student_id && item.course_id);
  //   } catch (error) {
  //     console.error('Error Get All :', (error as any).message);
  //     return [];
  //   }
  // }

  // Get All Courses For One Student
  async findByStudent(studentId: string) {
    return await this.enrollmentModel
      .find({
        student_id: new Types.ObjectId(studentId),
      })
      // .populate('course_id','course_name passing_grade')
      .exec();
  }

  // Delete student registration in course
  async remove(id: string) {
    const result = await this.enrollmentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Not Exist');
    }
    return { message: 'successfully cancelled and deleted.' };
  }
  // Update Grade
  async updateGrade(id: string, updateGradeDto: UpdateEnrollmentDto) {
    const updated = await this.enrollmentModel
      .findByIdAndUpdate(id, { grade: updateGradeDto.grade }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(
        'Registration dose not exist to modify Grade .',
      );
    }

    return { message: 'Grade has been successfully updated .', data: updated };
  }
}
