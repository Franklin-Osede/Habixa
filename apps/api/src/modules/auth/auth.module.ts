import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { LoginUseCase } from './application/login.use-case';
import { HashService } from './application/hash.service';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [
    forwardRef(() => IdentityModule),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [LoginUseCase, HashService, JwtStrategy, JwtAuthGuard],
  exports: [HashService, JwtAuthGuard],
})
export class AuthModule {}
