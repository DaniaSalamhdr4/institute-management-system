
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types  } from 'mongoose';
//import { User } from './user.schema';

export type CourseDocument = HydratedDocument<Course>;


@Schema({ timestamps: true })
export class Course {
  @Prop()
  course_name?: string;

  @Prop()
  passing_grade?: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  teacher_id?: Types.ObjectId 
  //| User; 
}

export const CourseSchema = SchemaFactory.createForClass(Course);
