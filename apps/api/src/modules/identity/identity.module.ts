import { Module } from '@nestjs/common';
import { IdentityController } from './identity.controller';
import { RegisterUserUseCase } from './application/register-user.use-case';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { UserRepository } from './domain/repositories/user.repository';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [IdentityController],
  providers: [
    PrismaService,
    RegisterUserUseCase,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UserRepository],
})
export class IdentityModule {}
