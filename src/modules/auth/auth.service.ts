import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, contraseña: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && contraseña === user.contraseña) {
      const { contraseña, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: Partial<User>) {
    const payload = { email: user.email, sub: user.id, rol: user.rol };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        nombre: user.nombre,
        apellido: user.apellido
      }
    };
  }

  async logout(userId: number) {
    try {
      // Aquí podrías agregar lógica adicional como:
      // - Invalidar el token en una lista negra
      // - Registrar la hora de cierre de sesión
      // - Limpiar sesiones activas del usuario
      
      return {
        message: 'Sesión cerrada exitosamente',
        userId: userId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new UnauthorizedException('Error al cerrar sesión');
    }
  }
} 