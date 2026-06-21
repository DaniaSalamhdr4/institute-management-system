import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // استخراج الـ Token من الـ Bearer Token المرسل في الطلب
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'SECRET_KEY_MOCK', // ضع هنا نفس مفتاح التشفير الموجود في الـ JwtModule لديك
    });
  }

  // هذه الدالة تنفذ تلقائياً بعد فك تشفير الـ Token وتضع البيانات في كائن request.user
  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role, // هنا يتم تمرير الـ role إلى الـ RolesGuard
    };
  }
}
