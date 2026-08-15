import { ForbiddenException } from '@nestjs/common';
import { UpdateUserGuard } from './update-user.guard';
import { Perfil } from '../generated/prisma/enums';
import { AuthenticatedUser } from '../casl/casl-ability.factory/casl-ability.factory';

describe('UpdateUserGuard', () => {
  const guard = new UpdateUserGuard();

  const makeContext = (user: AuthenticatedUser | undefined, id: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params: { id } }),
      }),
    }) as never;

  const selfId = '11111111-1111-1111-1111-111111111111';
  const otherId = '22222222-2222-2222-2222-222222222222';

  it('allows admin to update any user', () => {
    const admin: AuthenticatedUser = {
      sub: otherId,
      username: 'Admin',
      perfil: Perfil.admin,
    };

    expect(guard.canActivate(makeContext(admin, selfId))).toBe(true);
  });

  it('allows normal user to update own record', () => {
    const normal: AuthenticatedUser = {
      sub: selfId,
      username: 'Normal',
      perfil: Perfil.normal,
    };

    expect(guard.canActivate(makeContext(normal, selfId))).toBe(true);
  });

  it('denies normal user updating another user', () => {
    const normal: AuthenticatedUser = {
      sub: selfId,
      username: 'Normal',
      perfil: Perfil.normal,
    };

    expect(() => guard.canActivate(makeContext(normal, otherId))).toThrow(
      ForbiddenException,
    );
  });
});
