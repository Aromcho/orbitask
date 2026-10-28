import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { JwtPayload } from './auth.types.js';
import { CurrentUser } from './current-user.decorator.js';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto.js';

/** Gestión de usuarios: solo para el admin (ADMIN_EMAIL del .env). */
@Controller('users')
export class UsersController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  findAll(@CurrentUser() me: JwtPayload) {
    this.auth.assertAdmin(me);
    return this.auth.listUsers();
  }

  @Post()
  create(@CurrentUser() me: JwtPayload, @Body() dto: CreateUserDto) {
    this.auth.assertAdmin(me);
    return this.auth.createUser(dto);
  }

  @Patch(':id')
  update(@CurrentUser() me: JwtPayload, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    this.auth.assertAdmin(me);
    return this.auth.updateUser(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() me: JwtPayload, @Param('id') id: string) {
    this.auth.assertAdmin(me);
    await this.auth.removeUser(me, id);
  }
}
