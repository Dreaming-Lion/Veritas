# app/model/nli_fast.py
"""배치 NLI 추론 (premise 1개 × hypothesis N개).

기존 model.nli_infer 는 건당 추론이다. 여기서는 길이순 정렬 + 패딩 배치 + inference_mode 를 사용한다.
int8 동적 양자화 옵션이 있으나, 측정 결과 추천 순위가 크게 바뀌어(Top-5 겹침 56%) 기본값은 꺼져 있다.
"""
import torch
import torch.nn.functional as F

import app.model.model as base

_q_model = None


def get_model(quantize: bool = False):
    base.load_model()
    global _q_model
    if not quantize:
        return base._model
    if _q_model is None:
        _q_model = torch.quantization.quantize_dynamic(base._model, {torch.nn.Linear}, dtype=torch.qint8)
        _q_model.eval()
    return _q_model


@torch.inference_mode()
def nli_batch(premise: str, hyps, *, quantize: bool = False, batch_size: int = 16, max_length: int = 256):
    """[[entailment, neutral, contradiction], ...] 를 hyps 순서대로 반환"""
    model = get_model(quantize)
    tok = base._tokenizer
    order = sorted(range(len(hyps)), key=lambda i: len(hyps[i] or ""))
    out = [None] * len(hyps)
    for s in range(0, len(order), batch_size):
        idx = order[s:s + batch_size]
        enc = tok(
            [premise] * len(idx),
            [hyps[i] or "" for i in idx],
            return_tensors="pt",
            truncation="longest_first",
            max_length=max_length,
            padding=True,
        )
        probs = F.softmax(model(**enc).logits, dim=-1).tolist()
        for i, p in zip(idx, probs):
            out[i] = p
    return out
