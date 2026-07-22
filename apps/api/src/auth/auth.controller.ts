import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('v1')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  async me(@Req() req: any) {
    // Stub: retorna usuário de sessão
    return {
      id: 'demo-user',
      email: 'demo@b2geo.com',
      name: 'Usuário Demo',
      organizationId: 'demo-org',
    };
  }

  @Post('auth/login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('auth/logout')
  async logout() {
    return { status: 'logged_out' };
  }
}