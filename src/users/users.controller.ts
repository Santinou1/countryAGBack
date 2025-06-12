import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<User[]> {
    return await this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return await this.usersService.findOne(id);
  }

  @Post()
  async create(@Body() createUserDto: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return await this.usersService.create(createUserDto);
  }
}
