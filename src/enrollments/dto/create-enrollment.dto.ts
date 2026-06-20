import { IsNotEmpty, IsMongoId, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateEnrollmentDto {
  @IsNotEmpty()
  @IsMongoId()
  student_id?: string;

  @IsNotEmpty()
  @IsMongoId()
  course_id?: string;

  @IsOptional() 
  @IsNumber()
  @Min(0)
  @Max(100)
  grade?: number;
}
