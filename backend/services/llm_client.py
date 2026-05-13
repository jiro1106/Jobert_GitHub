from __future__ import annotations

import json
import os
from typing import Any

import requests

LFM_BASE_URL = os.getenv("LFM_BASE_URL", "http://127.0.0.1:8020/v1")
LFM_MODEL_NAME = os.getenv("LFM_MODEL_NAME", "local-lfm")


def extract_json(text: str) -> dict[str, Any]:
    first = text.find("{")
    last = text.rfind("}")

    if first == -1 or last == -1:
        raise ValueError(f"No JSON object found in LLM output: {text}")

    return json.loads(text[first:last + 1])


def call_lfm_chat(messages: list[dict[str, str]], temperature: float = 0.1) -> str:
    response = requests.post(
        f"{LFM_BASE_URL}/chat/completions",
        json={
            "model": LFM_MODEL_NAME,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 512,
        },
        timeout=60,
    )

    response.raise_for_status()
    payload = response.json()

    return payload["choices"][0]["message"]["content"]


def call_lfm_json(messages: list[dict[str, str]], temperature: float = 0.1) -> dict[str, Any]:
    text = call_lfm_chat(messages=messages, temperature=temperature)
    return extract_json(text)