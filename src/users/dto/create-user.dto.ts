import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsNumber()
  @IsNotEmpty()
  registration_year!: number;

  @IsString()
  @IsNotEmpty()
  specialization!: string;

  @IsEnum(['ADMIN', 'TEACHER', 'STUDENT'], {
    message: 'Role must be either ADMIN, TEACHER, or STUDENT',
  })
  @IsNotEmpty()
  role!: string;
}
