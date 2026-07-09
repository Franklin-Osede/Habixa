import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LoginUseCase } from './application/login.use-case';
import { RefreshTokenUseCase } from './application/refresh-token.use-case';
import { LogoutUseCase } from './application/logout.use-case';
import { LoginDto, RefreshTokenDto, LogoutDto } from './application/dtos/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    const result = await this.loginUseCase.execute(dto);

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return result.getValue();
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Exchange a refresh token for a new token pair' })
  async refresh(@Body() dto: RefreshTokenDto) {
    if (!dto?.refreshToken || typeof dto.refreshToken !== 'string') {
      throw new BadRequestException('refreshToken is required');
    }

    const result = await this.refreshTokenUseCase.execute(dto.refreshToken);

    // Any rotation failure (invalid / expired / reuse) is an auth failure.
    if (result.isFailure) {
      throw new UnauthorizedException(result.error);
    }

    return result.getValue();
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Revoke a refresh-token family (works even with an expired access token)',
  })
  async logout(@Body() dto: LogoutDto) {
    if (!dto?.refreshToken || typeof dto.refreshToken !== 'string') {
      throw new BadRequestException('refreshToken is required');
    }

    await this.logoutUseCase.execute(dto.refreshToken);
  }
}
