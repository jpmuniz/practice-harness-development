
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersRepository } from '../service/user.service';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private jwtService: JwtService
) {}

  async signIn(email: string, currentPassword: string): Promise<{ access_token: string }> {
    const user = await this.usersRepository.getUserWithPassword(email);
      // hash "fake" pra manter tempo de resposta consistente mesmo sem usuário
    const hashToCompare = user?.password ?? '';
    const isMatch = await bcrypt.compare(currentPassword, hashToCompare);
    if(!user || !isMatch){
      throw new NotFoundException("Credenciais inválidas");
    }
    const payload = {
      sub: user.email,
      username: user.name,
      perfil: user.perfil,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
