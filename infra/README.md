# infra — 홈서버 배포

관리자 웹은 nginx 정적 이미지 1개다. BE compose(프로젝트 `caquick`)의 네트워크 `caquick_default`에 external로 참여하고, BE 쪽 cloudflared가 `admin.caquick.site → http://caquick-admin:80`으로 라우팅한다. 인바운드 포트는 열지 않는다.

| 파일                                | 역할                                                              |
| ----------------------------------- | ----------------------------------------------------------------- |
| `compose.yml`                       | 서비스 `admin`(컨테이너 `caquick-admin`), 진단용 `127.0.0.1:8080` |
| `deploy.sh`                         | pull → up → healthy 대기 → prune. 배포 잡이 호출                  |
| `nginx.conf`·`security-headers.inc` | SPA fallback, 자산 immutable 캐시, `/healthz`, CSP 등             |
| `.env.example`                      | 배포 잡이 만드는 `.env`의 키                                      |

## 흐름

`main` push → CI 성공 → `Build Image`(arm64, GHCR `:<sha>`) → `Deploy`(셀프호스트 러너 `macmini`, Environment `production`) → `deploy.sh`.
롤백은 `Deploy`를 `workflow_dispatch`로 이전 sha를 넣어 실행한다.

## 새 호스트 준비(1회)

1. BE compose가 떠 있어야 한다(네트워크 `caquick_default`).
2. 이 레포용 셀프호스트 러너를 같은 맥미니에 등록한다(라벨 `macmini`). Settings → Actions → Runners → New self-hosted runner. 러너 디렉터리는 BE 러너와 분리(예 `~/actions-runner-admin`).
3. Cloudflare Zero Trust → Tunnel → Public hostname 추가: `admin.caquick.site` → `HTTP` → `caquick-admin:80`.
4. GitHub Environment `production`(선택: 시크릿 `DISCORD_WEBHOOK_URL`, 변수 `DEPLOY_DIR` 기본 `/opt/caquick-admin`).

## 점검

```bash
curl -s http://127.0.0.1:8080/healthz      # ok
curl -sI http://127.0.0.1:8080/ | grep -i content-security-policy
docker compose -f /opt/caquick-admin/compose.yml ps
```
