import { Module } from '@nestjs/common';
import { UsersRepository } from './user.service';
import { PrismaService } from './prisma.service';

@Module({
  providers: [UsersRepository, PrismaService],
  exports: [UsersRepository, PrismaService]
})
export class ServiceModule {}
