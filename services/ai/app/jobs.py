import os
from pathlib import Path
from typing import Any

from .parsers import parse_lab_text, parse_symptom_text

def _safe_delete(path: str) -> None:
    try:
        Path(path).unlink(missing_ok=True)
    except Exception:
        pass

def run_stt_job(path: str) -> dict[str, Any]:
    try:
        from faster_whisper import WhisperModel

        model_name = os.getenv("WHISPER_MODEL", "small")
        compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
        beam_size = int(os.getenv("WHISPER_BEAM_SIZE", "2"))

        model = WhisperModel(
            model_name,
            device="cpu",
            compute_type=compute_type,
            cpu_threads=2,
        )
        segments, info = model.transcribe(
            path,
            language="ko",
            vad_filter=True,
            beam_size=beam_size,
        )
        text = " ".join(segment.text.strip() for segment in segments).strip()
        return {
            "text": text,
            "language": info.language,
            "parsed": parse_symptom_text(text),
            "needs_user_confirmation": True,
        }
    finally:
        _safe_delete(path)

def run_ocr_job(path: str) -> dict[str, Any]:
    try:
        from paddleocr import PaddleOCR

        ocr = PaddleOCR(
            lang="korean",
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
        )

        lines: list[str] = []

        try:
            result = ocr.predict(input=path)
            for page in result:
                data = getattr(page, "json", None)
                if callable(data):
                    data = data()
                if isinstance(data, dict):
                    rec_texts = data.get("res", {}).get("rec_texts", [])
                    lines.extend(str(x) for x in rec_texts)
        except Exception:
            # Compatibility fallback for PaddleOCR APIs exposing ocr().
            result = ocr.ocr(path)
            for block in result or []:
                for row in block or []:
                    if isinstance(row, (list, tuple)) and len(row) > 1:
                        candidate = row[1]
                        if isinstance(candidate, (list, tuple)) and candidate:
                            lines.append(str(candidate[0]))

        text = "\n".join(lines)
        return {
            "text": text,
            "parsed": parse_lab_text(text),
            "needs_user_confirmation": True,
        }
    finally:
        _safe_delete(path)
