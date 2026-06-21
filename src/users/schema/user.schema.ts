import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
  name!: string;

  @Prop({ unique: true })
  email!: string;

  @Prop()
  password!: string;

  @Prop()
  phone!: string;

  @Prop()
  registration_year!: number;

  @Prop()
  specialization!: string;  
  
  @Prop({
    enum: ['ADMIN', 'TEACHER', 'STUDENT'],
  })
  role!: string;
}

export const UserSchema =
SchemaFactory.createForClass(User);