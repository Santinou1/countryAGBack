import { Controller, Post, Body, UnauthorizedException, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { UpdateUserDto } from '../users/dto/update-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private usersService: UsersService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.contraseña,
    );
    
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    return this.authService.logout(req.user.id);
  }

  @Post('set-password')
  async setPassword(@Body() body: { email: string; nuevaContrasena: string }) {
    const user = await this.usersService.findByEmail(body.email);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    if (user.contraseña !== null && user.contraseña !== '') {
      throw new UnauthorizedException('La contraseña ya está establecida');
    }
    await this.usersService.update(user.id, { contraseña: body.nuevaContrasena });
    return { message: 'Contraseña actualizada correctamente' };
  }
} 