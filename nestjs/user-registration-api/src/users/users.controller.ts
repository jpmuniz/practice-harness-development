import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ParseEmailPipe } from 'src/pipes/parse-email.pipe';
import { UniqueEmailPipe } from 'src/pipes/unique-email.pipe';
import { PoliciesGuard } from 'src/casl/PoliciesGuard';
import { CheckPolicies } from 'src/decorator/permission';
import {
  CreateUserPolicyHandler,
  DeleteUserPolicyHandler,
} from 'src/casl/policies/user.policies';

@Controller('users')
export class UsersController {
  constructor(private readonly usersProvider: UsersService) {}

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies(new CreateUserPolicyHandler())
  async create(@Body(UniqueEmailPipe) userData: UserDto): Promise<any> {
    return this.usersProvider.create(userData);
  }

  @Get()
  async findAll() {
    return this.usersProvider.findAll();
  }

  @Get(':email')
  async findOne(
    @Param('email', ParseEmailPipe) email: string,
  ): Promise<Omit<UserDto, 'password'> | null> {
    return this.usersProvider.findOne(email);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersProvider.update(+id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(new DeleteUserPolicyHandler())
  async remove(@Param('id') id: string) {
    return this.usersProvider.remove(id);
  }
}
