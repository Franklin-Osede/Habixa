import { Module, forwardRef } from '@nestjs/common';
import { IdentityController } from './identity.controller';
import { RegisterUserUseCase } from './application/register-user.use-case';
import { GetUserProfileUseCase } from './application/get-user-profile.use-case';
import { UpdateProfileUseCase } from './application/update-profile.use-case';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { UserRepository } from './domain/repositories/user.repository';
import { PrismaService } from '../../common/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [IdentityController],
  providers: [
    PrismaService,
    RegisterUserUseCase,
    GetUserProfileUseCase,
    UpdateProfileUseCase,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UserRepository],
})
export class IdentityModule {}
