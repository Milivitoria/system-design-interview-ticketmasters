export interface AccessTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface TokenStrategy {
  generateToken(identifier: string, secret: string): Promise<AccessTokenResponse>;
}
