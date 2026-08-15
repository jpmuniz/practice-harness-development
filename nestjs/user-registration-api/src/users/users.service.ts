import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from '../service/user.service';
import { AuthenticatedUser } from '../casl/casl-ability.factory/casl-ability.factory';
import { Perfil } from '../generated/prisma/enums';
import bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UsersRepository) {}

  async create(createUserDto: UserDto) {
    const saltRounds = 10;
    const { password, ...rest } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return await this.userRepository.createUser({
      ...rest,
      password: hashedPassword,
    });
  }

  async findAll() {
    return await this.userRepository.getAllusers({});
  }

  async findOne(email: string): Promise<Omit<UserDto, 'password'>> {
    const user = await this.userRepository.getUser(email);
    if (!user) {
      throw new NotFoundException(`Usuário com email ${email} não encontrado`);
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    actor: AuthenticatedUser,
  ) {
    const providedKeys = Object.entries(updateUserDto).filter(
      ([, value]) => value !== undefined,
    );
    if (providedKeys.length === 0) {
      throw new BadRequestException(
        'Informe ao menos um campo para atualização.',
      );
    }

    if (actor.perfil !== Perfil.admin && updateUserDto.perfil !== undefined) {
      throw new ForbiddenException('Você não tem permissão para esta ação');
    }

    const existing = await this.userRepository.getUserById(id);
    if (!existing) {
      throw new NotFoundException(`Usuário com id ${id} não encontrado`);
    }

    const data: {
      name?: string;
      email?: string;
      neighborhood?: string;
      street?: string;
      perfil?: Perfil;
      password?: string;
    } = {};

    if (updateUserDto.name !== undefined) {
      data.name = updateUserDto.name;
    }
    if (updateUserDto.neighborhood !== undefined) {
      data.neighborhood = updateUserDto.neighborhood;
    }
    if (updateUserDto.street !== undefined) {
      data.street = updateUserDto.street;
    }
    if (updateUserDto.perfil !== undefined) {
      data.perfil = updateUserDto.perfil;
    }

    if (updateUserDto.email !== undefined) {
      const email = updateUserDto.email.trim().toLowerCase();
      const owner = await this.userRepository.getUser(email);
      if (owner && owner.id !== id) {
        throw new ConflictException(
          'Já existe um usuário cadastrado com este e-mail.',
        );
      }
      data.email = email;
    }

    if (updateUserDto.password !== undefined) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    try {
      return await this.userRepository.updateUser({
        where: { id },
        data,
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2025'
      ) {
        throw new NotFoundException(`Usuário com id ${id} não encontrado`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    return this.userRepository.deleteUser({ id: String(id) });
  }
}
