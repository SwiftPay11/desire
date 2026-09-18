import { UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

import { Roles } from './roles.decorator';

import { Role } from '../../common/enums/role.enum';

export function Admin() {
  return UseGuards(
    JwtAuthGuard,
    RolesGuard,
  );
}

export const AdminOnly = () => Roles(Role.ADMIN);