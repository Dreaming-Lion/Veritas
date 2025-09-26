from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

MODEL_NAME = "Huffon/klue-roberta-base-nli"
LABELS = ["entailment", "neutral", "contradiction"]

tokenizer = None
model = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def load_model():
    global tokenizer, model
    if tokenizer is None or model is None:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
        model.to(device)

def nli_infer(premise, hypothesis):
    if not premise or not hypothesis:
        return "neutral", [0.33, 0.33, 0.33]

    # 토큰화
    inputs = tokenizer(
        premise,
        hypothesis,
        return_tensors="pt",
        truncation=True,
        max_length=512
    )

    # token_type_ids 제거 (RoBERTa는 segment embedding 안 씀)
    if "token_type_ids" in inputs:
        del inputs["token_type_ids"]

    # 안전 장치: vocab 범위 확인
    vocab_size = model.config.vocab_size
    max_token_id = inputs["input_ids"].max().item()
    if max_token_id >= vocab_size:
        print(f"[WARN] vocab mismatch: max token id {max_token_id} >= vocab_size {vocab_size}")
        return "neutral", [0.33, 0.33, 0.33]

    # 디바이스 강제 맞추기
    inputs = {k: v.to(device) for k, v in inputs.items()}
    model.to(device)

    # 추론
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)[0]
        label = LABELS[probs.argmax()]
    return label, probs.tolist()
