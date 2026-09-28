// vite의 ?raw 가져오기 — 빌드와 무관하게 파일 원문을 문자열로 읽는다
import headersInc from '../../../infra/security-headers.inc?raw';
import nginxConf from '../../../infra/nginx.conf?raw';

const read = (f: 'security-headers.inc' | 'nginx.conf') =>
  f === 'nginx.conf' ? nginxConf : headersInc;

/** 2026-09-28 실제 사고: prettier가 .inc를 줄바꿈해 CSP 값에 개행이 들어갔고 cloudflared가 502를 냈다. */
describe('nginx 설정', () => {
  it('add_header 지시어는 한 줄에 하나이고 따옴표 안에 개행이 없다', () => {
    const lines = read('security-headers.inc').split('\n');
    const directives = lines.filter((l) => l.trim().startsWith('add_header'));
    expect(directives.length).toBeGreaterThanOrEqual(5);
    for (const l of directives) {
      expect(l).toMatch(/^add_header \S+ ".*" always;$/);
      expect((l.match(/add_header/g) ?? []).length).toBe(1);
    }
    // 세미콜론으로 끝나지 않는 지시어 조각(줄바꿈된 잔해)이 없어야 한다
    for (const l of lines) {
      const t = l.trim();
      if (t === '' || t.startsWith('#')) continue;
      expect(t.endsWith(';')).toBe(true);
    }
  });

  it('CSP는 API·S3 오리진을 허용하고 프레임을 막는다', () => {
    const csp = /Content-Security-Policy "([^"]+)"/.exec(read('security-headers.inc'))?.[1] ?? '';
    expect(csp).toContain("connect-src 'self' https://api.caquick.site https://*.amazonaws.com");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain('\n');
  });

  it('nginx.conf는 SPA fallback·healthz·헤더 include를 가진다', () => {
    const conf = read('nginx.conf');
    expect(conf).toContain('try_files $uri $uri/ /index.html;');
    expect(conf).toContain('location = /healthz');
    expect(conf).toContain('include /etc/nginx/conf.d/security-headers.inc;');
  });
});
