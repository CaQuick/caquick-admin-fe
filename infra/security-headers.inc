# 브라우저 보안 헤더. 지시어 1개 = 1줄을 유지한다 — 따옴표 안에서 줄이 바뀌면 nginx는 값에 개행을 넣어 보내고 cloudflared가 'malformed MIME header'로 502를 낸다.
# connect-src: API + S3 presigned PUT(이미지 업로드). img-src: S3 공개 URL.
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.caquick.site https://*.amazonaws.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;
