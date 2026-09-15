# 승지정밀산업롤 TEST2

승지정밀산업롤의 제작품, 3D 시안, CAD 도면 검토와 제작 문의를 제공하는 웹사이트.

## 페이지

- `public/index.html`: 연속 재생 영상, 핵심 바로가기, 대표 제작품 3개와 연락처.
- `public/products.html`: 전체 제작품 사진, 3D 구조와 도면.
- `public/studio.html`: 5개 제품 모델의 단계별 구조, 소재와 시안 비교, 상담 조건.
- `public/design.html`: 수동 치수 설계 및 STEP·IGES·STL·DXF 가져오기.
- `public/quote.html`: 도면 첨부와 제작 문의, 접수 내역.
- `public/company.html`: 회사 소개, 제작 과정과 적용 사례.
- `public/location.html`: 주소 지도, 네이버·카카오 지도, 길찾기와 주소 복사.

메인은 상세 3D와 긴 공정 설명을 불러오지 않는다. 기존 메인 제품·공정·지도 북마크는 해당 페이지로 연결한다. 모니터 거치대는 현재 제품 목록에 포함하지 않는다.

## 실행

`npm ci` 후 `npm run build`를 실행한다. HTML/CSS/ES module과 Three.js를 사용하고, `dist/client`에 정적 파일, `dist/server/index.js`에 Sites용 Worker를 생성한다. `.openai/hosting.json`은 기존 TEST2의 ID와 문의 저장소 바인딩을 유지한다.

- `npm run check`: 제품 모델·도면·경로 검증.
- `node scripts/check-cad.mjs`: 실제 STEP/IGES/STL 치수 및 DXF 회전체, 오류 처리 검증.
- `node scripts/check-inquiries.mjs`: 접수와 첨부, 소유권, 용량 제한 검증.

문의 API는 Sites 인증과 R2를 사용한다. 정적 파일만 다른 호스팅에 복사하면 이 API는 동작하지 않는다. 공개 범위 변경은 별도 작업이며 현재 사이트는 noindex를 유지한다.

## CAD와 원본 자료

[CAD 가져오기 범위와 엔진 출처](docs/cad-import.md)를 참고한다. STEP·IGES는 원본 CAD 형상을 mm로 읽으며 STL은 단위를 확인해야 한다. DXF는 닫힌 롤 단면의 회전 형상을 생성한다. 임의의 DWG·PDF·사진에서 완전한 3D CAD를 복구하는 기능은 제공하지 않는다. 원본을 견적에 연결할 수 있고 치수 입력 설계도 유지한다.

사용자가 제공한 실제 제작 사진을 제품에 연결했다. 양단 축 롤의 깨끗한 이미지는 재구성 이미지이며 메인 대표 사진에는 실제 사진만 사용한다. 원본 사진 기록은 `source-assets/clean-photos-20260914/`에 있다. 카탈로그 3D 내부 부품과 기본 치수는 상담용 예시이며 실제 제조 사양·정비 순서가 아니다. 과거 분사식 나염기 특허는 회사 이력으로만 소개한다.

홈페이지 영상은 약 26.1초의 연속 영상이며 자동재생·음소거·반복 재생을 사용한다. 브라우저의 재생 제한과 동작 줄이기 설정을 존중한다.

## 신규 업로드 예제

`public/samples/sj-i160-idler-assembly.step`은 44개 부품의 중공형 웹 가이드 롤 CAD 예제입니다. 몸통 단면 DXF와 치수 PDF, 사용 안내를 함께 제공합니다. 도안 설계 페이지에서 내려받아 업로드할 수 있습니다. 메인에는 모니터 거치대의 실제 제작 사진을 추가했고, 모니터 거치대는 3D 시안실의 모델 목록에 포함하지 않습니다. 회사 연락처는 제공된 명함 기준으로 갱신했습니다.
