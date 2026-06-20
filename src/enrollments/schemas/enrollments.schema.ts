import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'enrollments', timestamps: true })
export class Enrollment extends Document {

  @Prop({type : Types.ObjectId , ref : 'User' , required :true})
  student_id?: Types.ObjectId ;

  @Prop({type : Types.ObjectId , ref : 'Course' , required :true})
  course_id?: Types.ObjectId;


  @Prop({ type: Number })
  grade?: number ; 
}


export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);