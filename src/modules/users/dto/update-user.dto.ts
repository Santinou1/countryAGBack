import { IsString, IsEmail, IsEnum, MinLength, IsOptional } from 'class-validator';
import { UserRole } from '../entities/user-role.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  apellido?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser válido' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  contraseña?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'El rol debe ser usuario, admin, propietario, proveedor o chofer' })
  rol?: UserRole;

  @IsOptional()
  @IsString()
  dni?: string;

  @IsOptional()
  @IsString()
  celular?: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsString()
  lote?: string;

  @IsOptional()
  @IsString()
  ocupacion?: string;

  @IsOptional()
  esPropietario?: boolean;

  @IsOptional()
  esProveedor?: boolean;
}
