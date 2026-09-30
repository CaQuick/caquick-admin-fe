# 브라우저 보안 헤더. 지시어 1개 = 1줄을 유지한다 — 따옴표 안에서 줄이 바뀌면 nginx는 값에 개행을 넣어 보내고 cloudflared가 'malformed MIME header'로 502를 낸다.
# connect-src: API + S3 presigned PUT(이미지 업로드). img-src: S3 공개 URL.
# script-src·frame-src: 카카오 우편번호(스크립트는 t1.kakaocdn.net, 검색 화면은 postcode.map.kakao.com iframe).
# 네이버 지도(매장 위치 미리보기): script-src oapi.map.naver.com(본체·인증 JSONP)·nrbe.pstatic.net(스타일 JSONP), connect-src kr-col-ext.nelo.navercorp.com(지도 스크립트의 오류 수집), 타일·아이콘은 img-src https:.
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://t1.kakaocdn.net https://oapi.map.naver.com https://nrbe.pstatic.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.caquick.site https://*.amazonaws.com https://kr-col-ext.nelo.navercorp.com; frame-src https://postcode.map.kakao.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;
