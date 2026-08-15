import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ServiceModule } from 'src/service/service.module';
import { CaslModule } from 'src/casl/casl.module';
import { UniqueEmailPipe } from 'src/pipes/unique-email.pipe';

@Module({
  imports: [ServiceModule, CaslModule],
  controllers: [UsersController],
  providers: [UsersService, UniqueEmailPipe],
  exports: [UsersService]
})
export class UsersModule {}
