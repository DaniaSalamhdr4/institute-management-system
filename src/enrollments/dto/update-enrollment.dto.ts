import { PartialType } from '@nestjs/mapped-types';
import { CreateEnrollmentDto } from './create-enrollment.dto';
import { IsNumber, Min , Max  } from 'class-validator';

export class UpdateEnrollmentDto extends PartialType(CreateEnrollmentDto) {
    @IsNumber()
    @Min(0)
    @Max(100)
    grade?:number;
}
