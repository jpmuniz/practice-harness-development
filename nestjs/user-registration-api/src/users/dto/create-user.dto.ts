import { IsEmail, IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { Perfil } from '../../generated/prisma/enums'; 


export class UserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsEnum(Perfil)
  perfil!: Perfil;

  password!: string;  

  @IsString()
  @IsNotEmpty()
  neighborhood!: string;

  @IsString()
  @IsNotEmpty()
  street!: string;
}