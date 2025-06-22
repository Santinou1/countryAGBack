import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.rol) {
      return false;
    }

    // El rol en el JWT podría venir en minúsculas (ej. 'admin') 
    // y en el enum estar en mayúsculas (ej. 'ADMIN').
    // Por eso comparamos de forma insensible a mayúsculas/minúsculas.
    return requiredRoles.some((role) => user.rol.toLowerCase() === role.toLowerCase());
  }
} 