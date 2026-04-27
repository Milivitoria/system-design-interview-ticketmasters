import { readFileSync } from 'fs';
import { resolve } from 'path';
import { importPKCS8, importSPKI, SignJWT, jwtVerify } from 'jose';
import { config } from '../config/config';

export interface JwtPayload {
  sub: string;
  upn: string;
  groups: string[];
  email?: string;
  app_name?: string;
  iss: string;
  exp: number;
}

let privateKey: Awaited<ReturnType<typeof importPKCS8>> | null = null;
let publicKey: Awaited<ReturnType<typeof importSPKI>> | null = null;

async function getPrivateKey() {
  if (!privateKey) {
    const pem = readFileSync(resolve(config.jwt.privateKeyPath), 'utf-8');
    privateKey = await importPKCS8(pem, 'RS256');
  }
  return privateKey;
}

async function getPublicKey() {
  if (!publicKey) {
    const pem = readFileSync(resolve(config.jwt.publicKeyPath), 'utf-8');
    publicKey = await importSPKI(pem, 'RS256');
  }
  return publicKey;
}

export async function signJwt(payload: {
  sub: string;
  upn: string;
  groups: string[];
  email?: string;
  app_name?: string;
}): Promise<string> {
  const key = await getPrivateKey();
  const expiresIn = config.jwt.expiresIn;

  const builder = new SignJWT({
    upn: payload.upn,
    groups: payload.groups,
    ...(payload.email !== undefined ? { email: payload.email } : {}),
    ...(payload.app_name !== undefined ? { app_name: payload.app_name } : {}),
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(config.jwt.issuer)
    .setSubject(payload.sub)
    .setExpirationTime(`${expiresIn}s`);

  return builder.sign(key);
}

export async function verifyJwt(token: string): Promise<JwtPayload> {
  const key = await getPublicKey();
  const { payload } = await jwtVerify(token, key, {
    issuer: config.jwt.issuer,
  });
  return payload as unknown as JwtPayload;
}
