import {
  IsNotEmpty,
  IsString,
  IsMongoId,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreateEnrollmentDto {
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  student_id?: string;

  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  course_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  grade?: number;
}
