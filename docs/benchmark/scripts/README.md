# 측정 스크립트

측정에 사용한 스크립트입니다. Docker 컨테이너(python:3.11 + torch CPU)에서 실행했고, 저장소를 `/repo`, 이 폴더와 결과를 `/work`에 마운트했습니다. Postgres 컨테이너에는 네트워크 별칭 `Veritas-db`, Qdrant에는 `qdrant`를 붙여 저장소 코드를 수정 없이 사용했습니다.

- `collect.py`: 14개 언론사 RSS 수집 + 요약 (기사 582건)
- `bench.py`: v1 / v2 응답 시간·추천 결과 측정 (40건)
- `bench5.py`, `eval_*.py`, `mksheet*.py`: v2+ 변형 측정, 판정 시트 생성, 정밀도 집계 (판정 결과는 스크립트 안의 `REL` 사전에 기록)
- `test_incremental.py`: 증분 인덱싱 / 삭제 / 추천 일치 확인
- `count_docs.py`: 법안·브리핑 문서 수 집계 (각자의 API 키 필요)

일부 스크립트는 벤치마크 중 사용한 임시 모듈(`v2plus` 실험판)을 가정하므로, 그대로 재실행하려면 `ai/app/services/recommend_v2plus.py` 기준으로 경로를 맞춰야 합니다.
