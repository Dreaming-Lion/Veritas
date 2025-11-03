from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch, torch.nn.functional as F

_MODEL_NAME = "MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7"
_tokenizer = None
_model = None
_LABELS = ["entailment", "neutral", "contradiction"]

def load_model():
    global _tokenizer, _model
    if _model is None:
        _tokenizer = AutoTokenizer.from_pretrained(_MODEL_NAME, use_fast=True)
        _model = AutoModelForSequenceClassification.from_pretrained(_MODEL_NAME)
        _model.eval()
    return True

def _safe_pair(premise: str, hypothesis: str):
    """모델 max position에 맞춰 토큰 기준으로 안전하게 자르기"""
    max_pos = getattr(_model.config, "max_position_embeddings", 512)
    max_len = max_pos - 3
    enc = _tokenizer(
        premise, hypothesis,
        add_special_tokens=True,
        truncation="longest_first",
        max_length=max_len,
        return_tensors=None
    )

    if len(enc["input_ids"]) > max_pos:

        p_ids = _tokenizer.encode(premise, add_special_tokens=False)
        h_ids = _tokenizer.encode(hypothesis, add_special_tokens=False)

        while len(p_ids) + len(h_ids) + 3 > max_len:
            if len(p_ids) >= len(h_ids):
                p_ids = p_ids[:-1]
            else:
                h_ids = h_ids[:-1]
        premise = _tokenizer.decode(p_ids, skip_special_tokens=True)
        hypothesis = _tokenizer.decode(h_ids, skip_special_tokens=True)
    return premise, hypothesis

@torch.no_grad()
def nli_infer(premise: str, hypothesis: str):
    global _tokenizer, _model
    if _model is None:
        load_model()
    if not premise or not hypothesis:
        return "neutral", [0.33, 0.34, 0.33]

    premise, hypothesis = _safe_pair(premise, hypothesis)

    inputs = _tokenizer(
        premise, hypothesis,
        return_tensors="pt",
        truncation="longest_first",
        max_length=min(getattr(_model.config, "max_position_embeddings", 512) - 3, 510)
    )
    logits = _model(**inputs).logits
    probs = F.softmax(logits, dim=-1).cpu().tolist()[0]
    label = _LABELS[int(probs.index(max(probs)))]
    return label, probs
