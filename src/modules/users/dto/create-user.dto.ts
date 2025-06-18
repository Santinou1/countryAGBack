import { IsString, IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
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

    @IsEnum(UserRole, { message: 'El rol debe ser usuario o admin' })
    rol?: UserRole = UserRole.USUARIO;

    @IsString()
    @IsNotEmpty({ message: 'El DNI es requerido' })
    dni: string;
} 