# CAD 가져오기

도안 설계 화면은 수동 파라미터 설계와 CAD 파일 보기를 함께 제공한다.

- STEP/STP, IGES/IGS: OpenCascade에서 형상을 읽고 mm 단위로 삼각망을 생성한다. 조립 파일에 포함된 메시별 선택과 원본 색상, 단면, 소재 보기, PNG/STL 저장을 지원한다. 이 과정은 2D 이미지로부터의 추정이 아니다.
- STL: ASCII/바이너리 삼각망. 파일에 단위가 없으므로 화면에서 mm/cm/m/inch를 지정한다. 기본값은 mm이며 사용자가 확인해야 한다.
- ASCII DXF: 선·호·폴리선으로 이루어진 닫힌 평면 단면을 X/Y축으로 회전한다. 단면 후보가 여럿이면 선택을 요구한다. 중심선이나 대칭 외형을 이용하며 불명확한 축·단위는 입력을 요구한다. 숨은 구멍, 나선 홈, 공차, 다른 투영도, 표제란의 치수는 추정하지 않는다. 블록은 변환을 적용하되 다중 배열·3D 폴리선·스플라인·바이너리 DXF는 자동 복원 대상이 아니다.
- DWG, PDF, 사진: 즉시 3D 변환 지원 대상이 아니다. CAD에서 DXF/STEP으로 내보내거나 기존 견적문의에 첨부한다.

DXF 결과는 선택 단면의 회전체이며 전체 CAD 설계 의도를 복구하는 기능이 아니다. 기존 수동 치수를 적용하면 수동 모델로 전환하며 CAD 원본은 수정하지 않는다. CAD의 부품을 임의의 정비 단계로 분해하지 않는다.

파일당 20MB. CAD 계산은 취소·시간 제한이 있는 브라우저 Worker에서 처리한다. STEP/IGES/DXF 엔진은 사용자 도면을 외부 서비스로 전송하지 않는다. 견적 연결을 누르면 원본은 IndexedDB에 일회성 보관되고 견적 페이지에서 소비된다. 접수 버튼을 눌러야 기존 보호된 R2 접수함으로 전송된다. 견적 첨부는 사용자 파일 최대 8개, 각 20MB, 합계 40MB다.

## 엔진과 재현

- [occt-import-js](https://github.com/kovacsv/occt-import-js), npm 0.0.23, LGPL-2.1. [원본·빌드 설명](https://github.com/kovacsv/occt-import-js#how-to-build-on-windows), [OpenCascade 소스](https://github.com/Open-Cascade-SAS/OCCT). 배포 바이너리 및 라이선스 원문을 `public/vendor/cad/`에 보관한다. 패키지 및 엔진을 수정하지 않았다.
- [dxf-parser](https://github.com/gdsestimating/dxf-parser), npm 1.1.2, MIT. 배포 번들과 라이선스 원문을 같은 폴더에 보관한다.
- `npm ci` 이후 `node scripts/check-cad.mjs`는 실제 STEP/IGES/STL과 DXF 샘플을 검증한다. `npm run build`는 고정된 패키지의 WASM을 사이트에 복사한다. 이 생성 바이너리는 소스 관리 대상에서 제외하며 배포물에는 포함된다.
- DXF 샘플 `public/samples/stepped-roll.dxf`: mm, 전체 800, 본체 600, 본체 외경 130, 양끝 축 외경 50, 중심선 y=0. 제작용 도면이 아닌 가져오기 예제다.

## 찾아오시는 길

기존 사이트의 주소인 경기도 화성시 팔탄면 서해로 986-7을 사용한다. Google 지도는 주소 검색 임베드, 네이버/카카오는 주소 검색 링크다. 측량 좌표나 정문 위치를 임의로 지정하지 않았다.
