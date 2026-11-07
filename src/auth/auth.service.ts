import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';

import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,

    private readonly jwtService: JwtService,

    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const exists =
      await this.usersService.findByEmail(
        registerDto.email,
      );

    if (exists) {
      throw new BadRequestException(
        'Email already exists',
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        registerDto.password,
        10,
      );

    const user =
      await this.usersService.create({
        fullName:
          registerDto.fullName,
        email:
          registerDto.email,
        password:
          hashedPassword,
        phone:
          registerDto.phone,
      });

    const token =
      this.jwtService.sign({
        sub: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
      });

    await Promise.allSettled([
      this.mailService.sendWelcomeEmail({
        email: user.email,
        fullName: user.fullName,
      }),

      this.mailService.sendNewCustomerAdminEmail({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      }),
    ]);

    return {
      message:
        'Account created successfully',

      token,

      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    };
  }

  async login(
    email: string,
    password: string,
  ) {
    const user =
      await this.usersService.findByEmail(
        email,
      );

    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const valid =
      await bcrypt.compare(
        password,
        user.password,
      );

    if (!valid) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const token =
      this.jwtService.sign({
        sub: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
      });

    return {
      message:
        'Login successful',

      token,

      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    };
  }

 async changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user =
    await this.usersService.findById(
      userId,
    );

  if (!user) {
    throw new UnauthorizedException(
      'User not found',
    );
  }

  const currentPasswordValid =
    await bcrypt.compare(
      currentPassword,
      user.password,
    );

  if (!currentPasswordValid) {
    throw new UnauthorizedException(
      'Current password is incorrect',
    );
  }

  const samePassword =
    await bcrypt.compare(
      newPassword,
      user.password,
    );

  if (samePassword) {
    throw new BadRequestException(
      'New password must be different from your current password',
    );
  }

  const hashedPassword =
    await bcrypt.hash(
      newPassword,
      10,
    );

  user.password =
    hashedPassword;

  await user.save();

  await this.mailService
    .sendPasswordChangedEmail({
      email: user.email,
      fullName: user.fullName,
    });

  return {
    message:
      'Password changed successfully',
  };
}
 }