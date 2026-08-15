import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AppAbility,
  AuthenticatedUser,
  CaslAbilityFactory,
} from './casl-ability.factory/casl-ability.factory';
import { PolicyHandler } from './IPolicyHandler';
import { CHECK_POLICIES_KEY } from 'src/decorator/permission';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    const { user } = context.switchToHttp().getRequest();
    const ability = this.caslAbilityFactory.createForUser(
      user as AuthenticatedUser,
    );

    const allowed = policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability),
    );

    if (!allowed) {
      throw new ForbiddenException('Você não tem permissão para esta ação');
    }

    return true;
  }

  private execPolicyHandler(handler: PolicyHandler, ability: AppAbility) {
    if (typeof handler === 'function') {
      return handler(ability);
    }
    return handler.handle(ability);
  }
}
