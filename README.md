# 내 집 마련 재무 시뮬레이터

아파트 매수를 기반으로 잔금일 이후의 현금, 신용대출, 주담대 상환 추이를 실시간으로 분석하는 웹 앱입니다.

**Live:** https://yangcoding1.github.io/buy-house/

## 주요 기능

- 월급, 생활비, 잔금까지 남은 달 등 변수를 입력하면 잔금일 총 가용 현금 자동 계산
- 취득세, 중개보수, 법무/채권할인 등 부대비용 자동 산출 (툴팁으로 상세 내역 제공)
- 잔금일 이후 현금 / 신용대출 / 주담대 잔액 추이를 영역형 차트로 시각화
- 각 계열 토글로 원하는 데이터만 선택적으로 확인 가능
- 재무 위험도 관리

## 개발

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # 정적 빌드 → ./out
npm run lint
```

## 배포

`main` 브랜치에 push하면 GitHub Actions가 자동으로 정적 빌드 후 GitHub Pages에 배포합니다.
