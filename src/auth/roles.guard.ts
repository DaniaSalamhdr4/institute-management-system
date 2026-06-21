import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  // نستخدم الـ Reflector لقراءة الأدوار المكتوبة فوق الروابط
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. جلب الأدوار المطلوبة للرابط الحالي
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // إذا لم نحدد أي أدوار فوق الرابط، اسمح للجميع بالمرور تلقائياً
    if (!requiredRoles) {
      return true;
    }

    // 2. استخراج بيانات المستخدم المرفقة مع الطلب (Request)
    const { user } = context.switchToHttp().getRequest();

    // إذا كان المستخدم غير مسجل دخول أو لا يملك حقل role، ارفض الطلب
    if (!user || !user.role) {
      throw new ForbiddenException('خطأ: بيانات الصلاحيات مفقودة أو غير صالحة');
    }

    // 3. مقارنة دور المستخدم الحالي بالأدوار المطلوبة للرابط
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        'عذراً، لا تمتلك الصلاحيات الكافية للوصول هنا',
      );
    }

    // إذا تطابق الدور، يتم إرجاع true ويسمح للمستخدم بالدخول
    return true;
  }
}
