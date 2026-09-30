// vite의 ?raw 가져오기 — 빌드와 무관하게 파일 원문을 문자열로 읽는다
import workflow from '../../../.github/workflows/build-image.yml?raw';
import dockerfile from '../../../Dockerfile?raw';

/** 앱 소스(스펙 제외)가 읽는 VITE_ 변수. 빌드 때 값이 박히므로 이미지 빌드 경로에 빠지면 운영에서 조용히 비어 버린다 */
const sources = import.meta.glob<string>(['/src/**/*.{ts,tsx}', '!/src/**/*.spec.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
});
const usedEnv = [
  ...new Set(
    Object.values(sources).flatMap((code) =>
      [...code.matchAll(/import\.meta\.env\.(VITE_[A-Z0-9_]+)/g)].map((m) => m[1]!),
    ),
  ),
].sort();

describe('빌드 환경 변수', () => {
  it('앱이 읽는 변수를 찾는다(검사 대상이 비어 통과하지 않게)', () => {
    expect(usedEnv).toEqual(
      expect.arrayContaining(['VITE_API_BASE_URL', 'VITE_NAVER_MAP_CLIENT_ID']),
    );
  });

  it.each(usedEnv)('%s 는 Dockerfile ARG·ENV와 이미지 빌드 build-args로 들어간다', (name) => {
    expect(dockerfile).toMatch(new RegExp(`^ARG ${name}=`, 'm'));
    expect(dockerfile).toMatch(new RegExp(`^ENV ${name}=\\$\\{${name}\\}$`, 'm'));
    expect(workflow).toMatch(new RegExp(`^\\s+${name}=\\$\\{\\{ vars\\.${name}\\b`, 'm'));
  });

  it('지도 키는 레포(공개)에 값을 두지 않는다: Dockerfile 기본값이 비어 있다', () => {
    expect(dockerfile).toMatch(/^ARG VITE_NAVER_MAP_CLIENT_ID=$/m);
  });
});
