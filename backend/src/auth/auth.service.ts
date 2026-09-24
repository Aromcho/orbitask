import { Injectable, Logger, type OnApplicationBootstrap, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import type { Model } from 'mongoose';
import type { JwtPayload } from './auth.types.js';
import { User, type UserDocument } from './user.schema.js';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
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

  private toPublic(user: UserDocument) {
    return { id: user.id as string, email: user.email, name: user.name };
  }
}
