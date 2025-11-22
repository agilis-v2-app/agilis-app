'use server';

import { cookies } from 'next/headers';

export async function saveToken(token: string) {
  cookies().set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 1 dia
  });
}

export async function getToken() {
  return cookies().get('auth_token')?.value;
}
