import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schema/user.schema'; // تأكد من المسار الصحيح للـ Schema لديك
import * as bcrypt from 'bcrypt'; // إذا كنت تستخدم التشفير لكلمات المرور

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService, // حقن خدمة الـ JWT المدمجة
  ) {}

  async login(loginDto: any) {
    const { email, password } = loginDto;

    // 1. البحث عن المستخدم في قاعدة البيانات عبر البريد الإلكتروني
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException(
        'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      );
    }

    // 2. التحقق من صحة كلمة المرور (مقارنة مشفرة)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      );
    }

    // 3. تجهيز بيانات الـ Payload الحساسة وتضمين الـ role
    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role, // هامة جداً: لتمريرها لحارس الصلاحيات وتفعيل نظام الحماية
    };

    // 4. إنشاء الـ Token وإرجاعه مع بيانات المستخدم الأساسية
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role, // إرجاع الدور للـ Frontend لبناء واجهات مخصصة
      },
    };
  }
}
