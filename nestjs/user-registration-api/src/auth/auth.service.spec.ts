import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersRepository } from '../service/user.service';
import { Perfil } from '../generated/prisma/enums';
import bcrypt from 'bcrypt';

jest.mock('../service/user.service', () => ({
  UsersRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    compare: jest.fn(),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersRepository: { getUserWithPassword: jest.Mock };
  let jwtService: { signAsync: jest.Mock };

  const user = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@example.com',
    name: 'Admin',
    perfil: Perfil.admin,
    password: 'hashed',
    neighborhood: 'Centro',
    street: 'Rua A',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    usersRepository = {
      getUserWithPassword: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('token'),
    };
    authService = new AuthService(
      usersRepository as unknown as UsersRepository,
      jwtService as unknown as JwtService,
    );
    jest.mocked(bcrypt.compare).mockReset();
  });

  it('puts user UUID in JWT sub when credentials are valid', async () => {
    usersRepository.getUserWithPassword.mockResolvedValue(user);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await authService.signIn(user.email, 'secret');

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      username: user.name,
      perfil: user.perfil,
      email: user.email,
    });
  });

  it('throws NotFoundException when credentials are invalid', async () => {
    usersRepository.getUserWithPassword.mockResolvedValue(user);
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(authService.signIn(user.email, 'wrong')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
