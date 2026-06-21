import { SetMetadata } from '@nestjs/common';

// تحديد مفتاح خاص لحفظ الأدوار في ذاكرة النظام المؤقتة
export const ROLES_KEY = 'roles';

// الدالة التي سنستخدمها كـ وسام (Decorator) فوق الكنترولر
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
