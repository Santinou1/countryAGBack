import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class UsersService {
  private users: User[] = [];

  constructor(private readonly logger: LoggingService) {}

  async findAll(): Promise<User[]> {
    this.logger.log('Obteniendo todos los usuarios', 'UsersService');
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.users;
  }

  async findOne(id: number): Promise<User> {
    this.logger.log(`Buscando usuario con ID: ${id}`, 'UsersService');
    await new Promise(resolve => setTimeout(resolve, 100));
    const user = this.users.find(user => user.id === id);
    if (!user) {
      this.logger.error(`Usuario con ID ${id} no encontrado`, undefined, 'UsersService');
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    this.logger.log(`Creando nuevo usuario: ${user.username}`, 'UsersService');
    await new Promise(resolve => setTimeout(resolve, 100));
    const newUser: User = {
      id: this.users.length + 1,
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    this.logger.log(`Usuario creado exitosamente con ID: ${newUser.id}`, 'UsersService');
    return newUser;
  }
}
