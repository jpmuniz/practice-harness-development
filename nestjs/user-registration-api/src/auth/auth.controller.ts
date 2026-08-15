import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './auth.dto';
import { Throttle } from '@nestjs/throttler';
import { Public } from 'src/decorator/public';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Public()
  signIn(@Body() authDto: AuthDto) {
    return this.authService.signIn(authDto.email, authDto.password);
  }
}
