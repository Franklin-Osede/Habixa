import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/infrastructure/guards/jwt-auth.guard';
import { GetUserProfileUseCase } from './application/get-user-profile.use-case';
import { RegisterUserUseCase } from './application/register-user.use-case';
import { UpdateProfileUseCase } from './application/update-profile.use-case';
import { RegisterUserDto } from './application/dtos/register-user.dto';
import { UpdateProfileDto } from './application/dtos/update-profile.dto';

interface RequestWithUser {
  user: {
    userId: string;
  };
}

@Controller('identity')
export class IdentityController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    const result = await this.registerUserUseCase.execute(dto);

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return { message: 'User registered successfully' };
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const userId = req.user.userId;
    const result = await this.updateProfileUseCase.execute(userId, dto);
    if (result.isSuccess) {
      return { message: 'Profile updated successfully' };
    } else {
      throw new BadRequestException(result.error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: { user: { userId: string } }) {
    // req.user is populated by JwtStrategy (contains userId and email)
    const userId = req.user.userId;
    const result = await this.getUserProfileUseCase.execute(userId);

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return result.getValue();
  }
}
