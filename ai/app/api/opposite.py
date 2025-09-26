from app.model.model import nli_infer
from fastapi import APIRouter, Query
import psycopg2
from summa import summarizer

router = APIRouter()

def get_conn():
    return psycopg2.connect(
        host="Veritas-db",
        dbname="appdb",
        user="appuser",
        password="apppw"
    )

def summarize_text(text, ratio=0.2):
    try:
        summary = summarizer.summarize(text, ratio=ratio)
        if summary.strip():
            return summary
    except:
        pass
    return text  # 요약 실패 시 원문 사용

@router.get("/article/recommend")
def recommend_articles(clicked_link: str = Query(..., description="사용자가 클릭한 기사 URL")):
    conn = get_conn()
    cur = conn.cursor()

    # 클릭한 기사 가져오기
    cur.execute("SELECT content FROM news WHERE link = %s;", (clicked_link,))
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return {"error": "해당 기사를 찾을 수 없습니다."}

    premise = summarize_text(row[0])  # 요약 후 premise 설정

    # 후보 기사 (많이 불러오기)
    cur.execute(
        "SELECT title, content, link FROM news WHERE link != %s ORDER BY date DESC LIMIT 40;",
        (clicked_link,)
    )
    candidates = cur.fetchall()
    cur.close(); conn.close()

    # NLI 비교
    results = []
    for title, content, link in candidates:
        hypothesis = summarize_text(content)
        label, probs = nli_infer(premise, hypothesis)
        if label == "contradiction":
            results.append({
                "title": title,
                "link": link,
                "label": label,
                "probs": {
                    "entailment": probs[0],
                    "neutral": probs[1],
                    "contradiction": probs[2],
                }
            })

    return {"clicked": clicked_link, "recommendations": results}
