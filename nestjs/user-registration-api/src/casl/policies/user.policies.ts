import { AppAbility } from '../casl-ability.factory/casl-ability.factory';
import { IPolicyHandler } from '../IPolicyHandler';
import { Action } from 'src/permission/action';
import { User } from 'src/permission/user';

export class CreateUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.Create, User);
  }
}

export class DeleteUserPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.Delete, User);
  }
}
