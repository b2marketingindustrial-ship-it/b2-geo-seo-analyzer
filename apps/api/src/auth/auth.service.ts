import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async login(email: string, password: string) {
    // Stub: no MVP, autenticação simulada
    if (!email || !password) {
      return { error: 'Email e senha são obrigatórios' };
    }
    return {
      accessToken: 'demo-jwt-token',
      user: {
        id: 'demo-user',
        email,
        name: 'Usuário Demo',
        organizationId: 'demo-org',
      },
    };
  }
}