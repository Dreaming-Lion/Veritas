from fastapi import FastAPI

app = FastAPI(title="Veritas AI", version="0.1.0")

@app.get("/")
async def root():
    return {"message": "Veritas API에 오신 것을 환영합니다!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
