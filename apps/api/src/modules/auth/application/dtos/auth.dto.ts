export class LoginDto {
  email!: string;
  password!: string;
}

export class RefreshTokenDto {
  refreshToken!: string;
}

export class LogoutDto {
  refreshToken!: string;
}

export interface JwtPayload {
  sub: string; // user ID
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
