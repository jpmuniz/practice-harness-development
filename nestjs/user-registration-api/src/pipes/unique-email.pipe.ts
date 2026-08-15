import {
  PipeTransform,
  Injectable,
  ConflictException,
  ArgumentMetadata,
} from '@nestjs/common';
import { UserDto } from 'src/users/dto/create-user.dto';
import { UsersRepository } from 'src/service/user.service';

@Injectable()
export class UniqueEmailPipe implements PipeTransform<UserDto, Promise<UserDto>> {
  constructor(private readonly usersRepository: UsersRepository) {}

  async transform(
    value: UserDto,
    _metadata: ArgumentMetadata,
  ): Promise<UserDto> {
    const email = value?.email?.trim().toLowerCase();

    if (!email) {
      return value;
    }

    const existingUser = await this.usersRepository.getUser(email);

    if (existingUser) {
      throw new ConflictException(
        'Já existe um usuário cadastrado com este e-mail.',
      );
    }

    return { ...value, email };
  }
}
