import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { RegisterUserUseCase } from './application/register-user.use-case';
import { RegisterUserDto } from './application/dtos/register-user.dto';

@Controller('identity')
export class IdentityController {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    const result = await this.registerUserUseCase.execute(dto);

    if (result.isFailure) {
      throw new BadRequestException(result.error);
    }

    return { message: 'User registered successfully' };
  }
}
