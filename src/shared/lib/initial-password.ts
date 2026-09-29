import { z } from 'zod';

export const INITIAL_PASSWORD_MIN = 8;
export const INITIAL_PASSWORD_HELP = '8~64자. 첫 로그인 때 변경이 강제됩니다.';

/** 관리자가 정해 전달하는 임시 비밀번호. 첫 로그인 때 강한 규칙으로 바꾸게 하므로 길이만 본다. */
export const initialPasswordSchema = z
  .string()
  .min(INITIAL_PASSWORD_MIN, '8자 이상')
  .max(64, '64자 이하');
