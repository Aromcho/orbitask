import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  type OnApplicationBootstrap,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { type Connection, isValidObjectId, Types } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import type { Model } from 'mongoose';
import type { JwtPayload } from './auth.types.js';
import type { CreateUserDto, UpdateUserDto } from './dto/users.dto.js';
import { User, type UserDocument } from './user.schema.js';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /** App personal: si la base está vacía, crea tu usuario con los datos del .env. */
  async onApplicationBootstrap() {
    if ((await this.users.estimatedDocumentCount()) > 0) return;

    const email = this.config.getOrThrow<string>('ADMIN_EMAIL');
    const password = this.config.getOrThrow<string>('ADMIN_PASSWORD');
    await this.users.create({
      email,
      name: this.config.get<string>('ADMIN_NAME', 'Yo'),
      passwordHash: await bcrypt.hash(password, 10),
    });
    this.logger.log(`Usuario inicial creado: ${email}`);
  }

  async login(email: string, password: string) {
    const user = await this.users.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return { token: await this.jwt.signAsync(payload), user: this.toPublic(user) };
  }

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    return this.toPublic(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
  }

  // ---------- Gestión de usuarios (solo admin) ----------

  /** El admin es el usuario del ADMIN_EMAIL del .env. */
  isAdmin(email: string) {
    return email.toLowerCase() === this.config.getOrThrow<string>('ADMIN_EMAIL').toLowerCase();
  }

  assertAdmin(user: JwtPayload) {
    if (!this.isAdmin(user.email)) throw new ForbiddenException('Solo el admin puede gestionar usuarios');
  }

  async listUsers() {
    const users = await this.users.find().sort({ createdAt: 1 });
    return users.map((u) => this.toPublic(u));
  }

  async createUser(dto: CreateUserDto) {
    const email = dto.email.toLowerCase();
    if (await this.users.exists({ email })) throw new ConflictException('Ya existe un usuario con ese email');
    const user = await this.users.create({
      email,
      name: dto.name,
      passwordHash: await bcrypt.hash(dto.password, 10),
    });
    return this.toPublic(user);
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.findUser(id);
    if (dto.email !== undefined) {
      const email = dto.email.toLowerCase();
      // El email del admin sale del .env: cambiarlo le quitaría el acceso a esta sección.
      if (this.isAdmin(user.email) && !this.isAdmin(email)) {
        throw new BadRequestException('El email del admin se cambia desde el .env');
      }
      if (email !== user.email && (await this.users.exists({ email }))) {
        throw new ConflictException('Ya existe un usuario con ese email');
      }
      user.email = email;
    }
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.password) user.passwordHash = await bcrypt.hash(dto.password, 10);
    await user.save();
    return this.toPublic(user);
  }

  async removeUser(me: JwtPayload, id: string) {
    const user = await this.findUser(id);
    if (user.id === me.sub || this.isAdmin(user.email)) {
      throw new BadRequestException('No podés eliminar al admin');
    }
    // Borra también todo lo suyo (tareas, finanzas, hábitos, deseos, eventos…).
    const userId = new Types.ObjectId(user.id as string);
    await Promise.all(
      Object.values(this.connection.models)
        .filter((model) => model.schema.path('userId'))
        .map((model) => model.deleteMany({ userId })),
    );
    await user.deleteOne();
  }

  private async findUser(id: string) {
    const user = isValidObjectId(id) ? await this.users.findById(id) : null;
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  private toPublic(user: UserDocument) {
    return {
      id: user.id as string,
      email: user.email,
      name: user.name,
      isAdmin: this.isAdmin(user.email),
      createdAt: (user as UserDocument & { createdAt?: Date }).createdAt,
    };
  }
}
