import { Perfil } from 'src/generated/prisma/enums';

export class User {
  id!: string;
  perfil!: Perfil;

  get isAdmin(): boolean {
    return this.perfil === Perfil.admin;
  }
}
