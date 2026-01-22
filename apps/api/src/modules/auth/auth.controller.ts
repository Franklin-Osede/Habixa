import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LoginUseCase } from './application/login.use-case';
import { LoginDto } from './application/dtos/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    const result = await this.loginUseCase.execute(dto);

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return result.getValue();
  }
}
