import { z } from 'zod';

export const INITIAL_PASSWORD_MIN = 8;
export const INITIAL_PASSWORD_MAX = 64;
export const INITIAL_PASSWORD_HELP =
  '8~64자로 정해 주세요. 받은 사람은 다음 로그인 때 비밀번호를 바꿔야 합니다.';

/** 관리자가 정해 전달하는 임시 비밀번호. 첫 로그인 때 강한 규칙으로 바꾸게 하므로 길이만 본다. */
export const initialPasswordSchema = z
  .string()
  .min(INITIAL_PASSWORD_MIN, '8자 이상 입력해 주세요.')
  .max(INITIAL_PASSWORD_MAX, '64자 이하로 입력해 주세요.')
  // BE 로그인이 공백뿐인 비밀번호를 거절한다 — 만들 수는 있어도 첫 로그인을 못 하게 된다
  .refine((v) => v.trim() !== '', '공백만으로는 만들 수 없습니다.');

/** 말로 불러 주거나 옮겨 적을 때 헷갈리는 글자(0·O·o, 1·l·I)를 뺐다 */
export const GENERATED_PASSWORD_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
export const GENERATED_PASSWORD_LENGTH = 12;

/**
 * 임시 비밀번호를 만든다. getRandomValues는 http LAN 접속(비보안 컨텍스트)에서도 있다.
 * 바이트를 글자 수로 나눈 나머지를 쓰면 앞쪽 글자가 더 자주 나오므로, 나누어떨어지는 구간 밖의 바이트는 버린다.
 */
export function generateInitialPassword(length = GENERATED_PASSWORD_LENGTH): string {
  const size = GENERATED_PASSWORD_ALPHABET.length;
  const limit = 256 - (256 % size);
  let out = '';
  while (out.length < length) {
    for (const byte of crypto.getRandomValues(new Uint8Array(length * 2))) {
      if (byte >= limit) continue;
      out += GENERATED_PASSWORD_ALPHABET[byte % size];
      if (out.length === length) break;
    }
  }
  return out;
}
