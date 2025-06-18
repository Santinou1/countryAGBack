import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.enum';
import { LoggingService } from '../../logging/logging.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly logger: LoggingService
  ) {}

  async onModuleInit() {
    await this.createDefaultUsers();
  }

  private async createDefaultUsers() {
    const defaultUsers = [
      {
        email: 'admin@admin.com',
        contraseña: '123456san',
        nombre: 'Admin',
        apellido: 'Sistema',
        rol: UserRole.ADMIN,
        dni: '11111111',
        celular: '1111111111'
      },
      {
        email: 'user@user.com',
        contraseña: '123456san',
        nombre: 'Usuario',
        apellido: 'Sistema',
        rol: UserRole.USUARIO,
        dni: '22222222',
        celular: '2222222222'
      }
    ];

    for (const userData of defaultUsers) {
      try {
        const existingUser = await this.usersRepository.findOne({
          where: { email: userData.email }
        });

        if (!existingUser) {
          await this.create(userData);
          this.logger.log(`Usuario por defecto creado: ${userData.email}`, 'UsersService');
        } else {
          this.logger.log(`Usuario por defecto ya existe: ${userData.email}`, 'UsersService');
        }
      } catch (error) {
        this.logger.error(`Error al crear usuario por defecto ${userData.email}: ${error.message}`, error.stack, 'UsersService');
      }
    }
  }

  async findAll(): Promise<User[]> {
    this.logger.log('Buscando todos los usuarios', 'UsersService');
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<User> {
    this.logger.log(`Buscando usuario con ID: ${id}`, 'UsersService');
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      this.logger.error(`Usuario con ID ${id} no encontrado`, undefined, 'UsersService');
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creando nuevo usuario con email: ${createUserDto.email}`, 'UsersService');
    
    // Verificar si el email ya existe
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      const errorMessage = `Ya existe un usuario con el email ${createUserDto.email}`;
      this.logger.error(errorMessage, undefined, 'UsersService');
      throw new BadRequestException(errorMessage);
    }

    const newUser = this.usersRepository.create({
      ...createUserDto,
      rol: createUserDto.rol || UserRole.USUARIO
    });

    const savedUser = await this.usersRepository.save(newUser);
    this.logger.log(`Usuario creado exitosamente con ID: ${savedUser.id}`, 'UsersService');
    return savedUser;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.log(`Actualizando usuario con ID: ${id}`, 'UsersService');
    
    // Verificar que el usuario existe
    await this.findOne(id);

    // Si se está actualizando el email, verificar que no exista
    if (updateUserDto.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email }
      });

      if (existingUser && existingUser.id !== id) {
        const errorMessage = `Ya existe un usuario con el email ${updateUserDto.email}`;
        this.logger.error(errorMessage, undefined, 'UsersService');
        throw new BadRequestException(errorMessage);
      }
    }

    await this.usersRepository.update(id, updateUserDto);
    const updatedUser = await this.findOne(id);
    this.logger.log(`Usuario actualizado exitosamente: ${id}`, 'UsersService');
    return updatedUser;
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Eliminando usuario con ID: ${id}`, 'UsersService');
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      const errorMessage = `Usuario con ID ${id} no encontrado`;
      this.logger.error(errorMessage, undefined, 'UsersService');
      throw new NotFoundException(errorMessage);
    }
    this.logger.log(`Usuario eliminado exitosamente: ${id}`, 'UsersService');
  }

  async findByEmail(email: string): Promise<User> {
    this.logger.log(`Buscando usuario por email: ${email}`, 'UsersService');
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      this.logger.error(`Usuario con email ${email} no encontrado`, undefined, 'UsersService');
      throw new NotFoundException(`Usuario con email ${email} no encontrado`);
    }
    return user;
  }

  async getMe(userId: number): Promise<User> {
    this.logger.log(`Obteniendo información del usuario: ${userId}`, 'UsersService');
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      this.logger.error(`Usuario no encontrado: ${userId}`, undefined, 'UsersService');
      throw new NotFoundException(`Usuario no encontrado`);
    }

    // Loguear la información completa del usuario
    this.logger.log('Información del usuario:', 'UsersService');
    this.logger.log(JSON.stringify({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      rol: user.rol
    }, null, 2), 'UsersService');

    return user;
  }
}
