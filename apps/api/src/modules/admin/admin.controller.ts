import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../../common/guards/roles.guard';
// Assuming JwtAuthGuard is in common/guards or auth module.
// I will temporarily comment it out if not found, but standard is:
import { AuthGuard } from '@nestjs/passport';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers() {
    return this.adminService.findAllUsers();
  }

  @Post('simulate-workout')
  async simulateWorkout(@Body() body: { userId: string; workoutId: string }) {
    return this.adminService.simulateWorkout(body.userId, body.workoutId);
  }

  @Post('unlock-phase')
  async forceUnlock(@Body() body: { userId: string; challengeId: string }) {
    return this.adminService.forceUnlock(body.userId, body.challengeId);
  }
}
