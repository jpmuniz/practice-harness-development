import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Perfil } from '../generated/prisma/enums';
import { AuthenticatedUser } from '../casl/casl-ability.factory/casl-ability.factory';

@Injectable()
export class UpdateUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      params: { id?: string };
    }>();
    const actor = request.user;
    const targetId = request.params?.id;

    if (!actor?.sub || !targetId) {
      throw new ForbiddenException('Você não tem permissão para esta ação');
    }

    if (actor.perfil === Perfil.admin) {
      return true;
    }

    if (actor.sub === targetId) {
      return true;
    }

    throw new ForbiddenException('Você não tem permissão para esta ação');
  }
}
