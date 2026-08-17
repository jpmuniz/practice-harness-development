import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from '../service/user.service';
import { Perfil } from '../generated/prisma/enums';
import { AuthenticatedUser } from '../casl/casl-ability.factory/casl-ability.factory';
import bcrypt from 'bcrypt';

jest.mock('../service/user.service', () => ({
  UsersRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
  },
}));

describe('UsersService.update', () => {
  let service: UsersService;
  let repo: {
    getUserById: jest.Mock;
    getUser: jest.Mock;
    updateUser: jest.Mock;
  };

  const userId = '11111111-1111-1111-1111-111111111111';
  const otherId = '22222222-2222-2222-2222-222222222222';

  const existing = {
    id: userId,
    email: 'user@example.com',
    name: 'User',
    perfil: Perfil.normal,
    neighborhood: 'Centro',
    street: 'Rua A',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const admin: AuthenticatedUser = {
    sub: otherId,
    username: 'Admin',
    perfil: Perfil.admin,
  };

  const normal: AuthenticatedUser = {
    sub: userId,
    username: 'User',
    perfil: Perfil.normal,
  };

  beforeEach(() => {
    repo = {
      getUserById: jest.fn(),
      getUser: jest.fn(),
      updateUser: jest.fn(),
    };
    service = new UsersService(repo as unknown as UsersRepository);
    jest.mocked(bcrypt.hash).mockReset();
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
  });

  it('persists allowed fields and returns user without password', async () => {
    repo.getUserById.mockResolvedValue(existing);
    repo.updateUser.mockResolvedValue({
      ...existing,
      name: 'Updated',
      street: 'Rua B',
    });

    const result = await service.update(
      userId,
      { name: 'Updated', street: 'Rua B' },
      admin,
    );

    expect(repo.updateUser).toHaveBeenCalledWith({
      where: { id: userId },
      data: { name: 'Updated', street: 'Rua B' },
    });
    expect(result).not.toHaveProperty('password');
    expect(result.name).toBe('Updated');
  });

  it('throws 404 when user does not exist', async () => {
    repo.getUserById.mockResolvedValue(null);

    await expect(
      service.update(userId, { name: 'X' }, admin),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws 400 when body has no updatable fields', async () => {
    await expect(service.update(userId, {}, admin)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws 403 when normal user tries to change perfil', async () => {
    await expect(
      service.update(userId, { perfil: Perfil.admin }, normal),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows admin to change perfil', async () => {
    repo.getUserById.mockResolvedValue(existing);
    repo.updateUser.mockResolvedValue({
      ...existing,
      perfil: Perfil.admin,
    });

    await service.update(userId, { perfil: Perfil.admin }, admin);

    expect(repo.updateUser).toHaveBeenCalledWith({
      where: { id: userId },
      data: { perfil: Perfil.admin },
    });
  });

  it('throws 409 when email belongs to another user', async () => {
    repo.getUserById.mockResolvedValue(existing);
    repo.getUser.mockResolvedValue({ ...existing, id: otherId });

    await expect(
      service.update(userId, { email: 'taken@example.com' }, admin),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows email update to the same value as current user', async () => {
    repo.getUserById.mockResolvedValue(existing);
    repo.getUser.mockResolvedValue(existing);
    repo.updateUser.mockResolvedValue(existing);

    await service.update(userId, { email: 'User@Example.com' }, admin);

    expect(repo.updateUser).toHaveBeenCalledWith({
      where: { id: userId },
      data: { email: 'user@example.com' },
    });
  });

  it('hashes password before persist and omits it from returned shape', async () => {
    repo.getUserById.mockResolvedValue(existing);
    repo.updateUser.mockResolvedValue(existing);

    await service.update(userId, { password: 'new-secret' }, normal);

    expect(bcrypt.hash).toHaveBeenCalledWith('new-secret', 10);
    expect(repo.updateUser).toHaveBeenCalledWith({
      where: { id: userId },
      data: { password: 'hashed-password' },
    });
    await expect(
      repo.updateUser.mock.results[0].value,
    ).resolves.not.toHaveProperty('password');
  });

  it('throws 404 when prisma update reports record missing', async () => {
    repo.getUserById.mockResolvedValue(existing);
    repo.updateUser.mockRejectedValue({ code: 'P2025' });

    await expect(
      service.update(userId, { name: 'Gone' }, admin),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
