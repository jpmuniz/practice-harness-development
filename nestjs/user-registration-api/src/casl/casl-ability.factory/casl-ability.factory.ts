import { Injectable } from '@nestjs/common';
import {
  MongoAbility,
  AbilityBuilder,
  ExtractSubjectType,
  InferSubjects,
  createMongoAbility,
} from '@casl/ability';
import { Action } from 'src/permission/action';
import { User } from 'src/permission/user';
import { Perfil } from 'src/generated/prisma/enums';

type Subjects = InferSubjects<typeof User> | 'all';

export type AppAbility = MongoAbility<[Action, Subjects]>;

export interface AuthenticatedUser {
  sub: string;
  username: string;
  perfil: Perfil;
  email?: string;
}

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: AuthenticatedUser): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user.perfil === Perfil.admin) {
      can(Action.Create, User);
      can(Action.Delete, User);
      can(Action.Read, 'all');
      can(Action.Update, User);
    } else {
      can(Action.Read, 'all');
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
