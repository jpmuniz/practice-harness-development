import { Injectable, NotFoundException } from '@nestjs/common';
import { UserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from '../service/user.service';
import bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private readonly userRepository: UsersRepository){}

   async create(createUserDto: UserDto) {
      const saltRounds = 10;
      const { password, ...rest } = createUserDto;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return await this.userRepository.createUser({
        ...rest,
        password: hashedPassword
      })
    }

  async findAll() {
    return await this.userRepository.getAllusers({})
  }

  async findOne(email: string): Promise<Omit<UserDto, 'password'>> {
    const user = await this.userRepository.getUser(email)
    if(!user){
      throw new NotFoundException(`Usuário com email ${email} não encontrado`);
    }
    return user
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async remove(id: string) {
    return this.userRepository.deleteUser({id: String(id)});
  }
}
