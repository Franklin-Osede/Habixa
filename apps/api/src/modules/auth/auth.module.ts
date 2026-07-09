import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { LoginUseCase } from './application/login.use-case';
import { RefreshTokenUseCase } from './application/refresh-token.use-case';
import { LogoutUseCase } from './application/logout.use-case';
import { HashService } from './application/hash.service';
import { TokenService } from './application/token.service';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { RefreshTokenRepository } from './domain/repositories/refresh-token.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/repositories/prisma-refresh-token.repository';
import { PrismaService } from '../../common/prisma.service';
import { IdentityModule } from '../identity/identity.module';
import { getJwtSecret, getAccessTtl } from './auth.config';

@Module({
  imports: [
    forwardRef(() => IdentityModule),
    PassportModule,
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: getAccessTtl() },
    }),
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    HashService,
    TokenService,
    JwtStrategy,
    JwtAuthGuard,
    {
      provide: RefreshTokenRepository,
      useClass: PrismaRefreshTokenRepository,
    },
  ],
  exports: [HashService, JwtAuthGuard],
})
export class AuthModule {}
