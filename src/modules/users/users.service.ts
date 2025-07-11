import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.enum';
import { LoggingService } from '../../logging/logging.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ILike } from 'typeorm';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly logger: LoggingService,
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
        dni: '21848036',
        celular: '2226502472',
        area: 'Nuestra Señora del Pilar',
        lote: '16',
        esPropietario: true,
        esProveedor: false,
      },
      {
        email: 'user@user.com',
        contraseña: '123456san',
        nombre: 'Usuario',
        apellido: 'Sistema',
        rol: UserRole.USUARIO,
        dni: '44264552',
        celular: '2226502471',
        ocupacion: 'Servicios Domesticos',
        esPropietario: false,
        esProveedor: true,
      },
      {
        email: 'chofer@chofer.com',
        contraseña: '123456san',
        nombre: 'Chofer',
        apellido: 'Sistema',
        rol: UserRole.CHOFER,
        dni: '12345678',
        celular: '2226502473',
        esPropietario: false,
        esProveedor: false,
      },
    ];

    for (const userData of defaultUsers) {
      try {
        const existingUser = await this.usersRepository.findOne({
          where: { email: userData.email },
        });

        if (!existingUser) {
          await this.create(userData);
          this.logger.log(`Usuario por defecto creado: ${userData.email}`, 'UsersService');
        } else {
          this.logger.log(`Usuario por defecto ya existe: ${userData.email}`, 'UsersService');
        }
      } catch (error) {
        this.logger.error(
          `Error al crear usuario por defecto ${userData.email}: ${error.message}`,
          error.stack,
          'UsersService',
        );
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
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      const errorMessage = `Ya existe un usuario con el email ${createUserDto.email}`;
      this.logger.error(errorMessage, undefined, 'UsersService');
      throw new BadRequestException(errorMessage);
    }

    // Verificar si el DNI ya existe
    if (createUserDto.dni) {
      const existingDni = await this.usersRepository.findOne({
        where: { dni: createUserDto.dni },
      });
      if (existingDni) {
        const errorMessage = `Ya existe un usuario con el DNI ${createUserDto.dni}`;
        this.logger.error(errorMessage, undefined, 'UsersService');
        throw new BadRequestException(errorMessage);
      }
    }

    const newUser = this.usersRepository.create({
      ...createUserDto,
      rol: createUserDto.rol || UserRole.USUARIO,
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
        where: { email: updateUserDto.email },
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
    this.logger.log(
      JSON.stringify(
        {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          rol: user.rol,
        },
        null,
        2,
      ),
      'UsersService',
    );

    return user;
  }

  async updateRole(id: number, updateRoleDto: UpdateRoleDto): Promise<User> {
    this.logger.log(
      `Actualizando rol del usuario con ID: ${id} a ${updateRoleDto.rol}`,
      'UsersService',
    );

    // Verificar que el usuario existe
    await this.findOne(id);

    await this.usersRepository.update(id, { rol: updateRoleDto.rol });
    const updatedUser = await this.findOne(id);
    this.logger.log(
      `Rol del usuario actualizado exitosamente: ${id} -> ${updateRoleDto.rol}`,
      'UsersService',
    );
    return updatedUser;
  }

  async findByDni(dni: string): Promise<User> {
    this.logger.log(`Buscando usuario por DNI: ${dni}`, 'UsersService');
    const user = await this.usersRepository.findOne({ where: { dni } });
    if (!user) {
      this.logger.error(`Usuario con DNI ${dni} no encontrado`, undefined, 'UsersService');
      throw new NotFoundException(`Usuario con DNI ${dni} no encontrado`);
    }
    return user;
  }

  async searchByDniOrName(q: string): Promise<User[]> {
    if (!q || q.trim().length < 2) return [];
    const query = q.trim();
    return this.usersRepository.find({
      where: [
        { dni: ILike(`%${query}%`) },
        { nombre: ILike(`%${query}%`) },
        { apellido: ILike(`%${query}%`) },
      ],
      take: 10,
      order: { apellido: 'ASC', nombre: 'ASC' },
    });
  }

  async blankPassword(id: number): Promise<User> {
    const user = await this.findOne(id);
    this.logger.log(`El administrador blanqueó la contraseña del usuario con ID: ${id}, email: ${user.email}`, 'UsersService');
    user.contraseña = null;
    await this.usersRepository.save(user);
    this.logger.log(`Contraseña blanqueada para el usuario con ID: ${id}, email: ${user.email}`, 'UsersService');
    return user;
  }
}
