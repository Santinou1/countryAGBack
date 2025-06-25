import { IsEnum } from 'class-validator';
import { UserRole } from '../entities/user-role.enum';

export class UpdateRoleDto {
  @IsEnum(UserRole, { message: 'El rol debe ser usuario, admin, propietario, proveedor o chofer' })
  rol: UserRole;
} 