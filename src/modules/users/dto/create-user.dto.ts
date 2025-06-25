import {
  IsString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  MinLength,
  IsBoolean,
  IsOptional,
  ValidateIf,
  IsNumberString,
} from 'class-validator';
import { UserRole } from '../entities/user-role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es requerido' })
  apellido: string;

  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  contraseña: string;

  @IsEnum(UserRole, { message: 'El rol debe ser usuario, admin, propietario, proveedor o chofer' })
  rol?: UserRole = UserRole.USUARIO;

  @IsNumberString({}, { message: 'El DNI debe ser un número' })
  @IsNotEmpty({ message: 'El DNI es requerido' })
  dni: string;

  @IsNumberString({}, { message: 'El celular debe ser un número' })
  @IsNotEmpty({ message: 'El celular es requerido' })
  celular: string;

  @ValidateIf(o => o.esPropietario === true)
  @IsString({ message: 'El área debe ser un texto' })
  @IsNotEmpty({ message: 'El área es requerida para propietarios' })
  area?: string;

  @ValidateIf(o => o.esPropietario === true)
  @IsString({ message: 'El lote debe ser un texto' })
  @IsNotEmpty({ message: 'El lote es requerido para propietarios' })
  lote?: string;

  @ValidateIf(o => o.esProveedor === true)
  @IsString({ message: 'La ocupación debe ser un texto' })
  @IsNotEmpty({ message: 'La ocupación es requerida para proveedores' })
  ocupacion?: string;

  @IsOptional()
  @IsBoolean({ message: 'esPropietario debe ser booleano' })
  esPropietario?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'esProveedor debe ser booleano' })
  esProveedor?: boolean;
}
