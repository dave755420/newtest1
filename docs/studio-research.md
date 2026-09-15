# 3D 시안실 개선 근거 · 2026-09-14

업체의 실제 제작 가능 범위와 해외 업체의 일반적인 상담 항목을 구분한다. 아래 출처의 공차, 설비 규모 또는 인증을 승지의 성능으로 옮기지 않는다.

- American Roller FAQ https://americanroller.com/faqs/
  견적에 롤 종류, 면장, 외경, 도금·피복·가공 표면을 함께 받는다. 도면 첨부 흐름이 있다.
- American Roller RFQ https://americanroller.com/request-a-quote/
  신규 제작 / 재피복·수리 / 표면 처리 종류 / 도면 첨부를 구분한다.
- Pinnacle machining https://www.pinnacleroller.com/services/machining-services-and-roll-fabrication
  기존 롤 축의 마모, 변형, 파손과 신규 제작을 구분한다. 상태 기록과 도면 번호 필드를 도입한 근거다.
- Pinnacle balancing https://www.pinnacleroller.com/services/dynamic-balancing
  회전 균형과 기록의 중요성을 설명한다. 사용 회전수와 검사 성적서 요청 필드를 두되, 사이트에서 균형을 계산하거나 검사 능력을 보증하지 않는다.
- American Roller TC100 https://americanroller.com/related-resources/arcotherm-tc100/
  경도, 피막 두께, 표면 거칠기와 TIR 등을 별도 사양으로 다룬다. 특정 코팅의 수치·조건을 다른 소재에 적용하지 않는다.

구현: 단계별 개념 분해(실제 정비 순서가 아님), 소재 비교 2안, 모델 부품 목록 CSV(발주 BOM 아님), 사용·재가공 조건과 상담 사양서, 견적 접수 연결. 모니터 거치대 전시 제외.
