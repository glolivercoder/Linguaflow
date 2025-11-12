"""FastAPI service for Anki deck import and offline translation."""

from __future__ import annotations

import base64
import logging
import mimetypes
import os
import re
import shutil
import tempfile
from pathlib import Path
from typing import Iterable, List, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure headless operation for Anki/Qt
os.environ.setdefault("ANKI_HEADLESS", "1")
os.environ.setdefault("ANKI_IMPORT_MODE", "1")
os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
os.environ.setdefault("AQTVERSION", "pyqt6")

try:  # Lazy import so the service can still start without dependencies during setup
    from anki.collection import Collection
    from anki.importing.apkg import AnkiPackageImporter
except Exception as exc:  # pragma: no cover - handled during /health
    Collection = None  # type: ignore
    AnkiPackageImporter = None  # type: ignore
    IMPORT_ERROR = exc
else:
    IMPORT_ERROR = None

try:
    import argostranslate.translate as argos_translate
except Exception as exc:  # pragma: no cover
    argos_translate = None  # type: ignore
    ARGOS_IMPORT_ERROR = exc
else:
    ARGOS_IMPORT_ERROR = None

from bs4 import BeautifulSoup

LOGGER = logging.getLogger("anki_import_service")
logging.basicConfig(level=logging.INFO)

DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3003",
]

LANGUAGE_CODE_MAP = {
    "en-US": "en",
    "en-GB": "en",
    "es-ES": "es",
    "pt-BR": "pt",
    "fr-FR": "fr",
    "it-IT": "it",
    "de-DE": "de",
    "zh-CN": "zh",
    "ja-JP": "ja",
    "ru-RU": "ru",
    "eo": "eo",
}

IMAGE_REGEX = re.compile(r"<img[^>]+src=\"([^\">]+)\"")
SOUND_TAG_REGEX = re.compile(r"<audio[^>]+src=\"([^\">]+)\"")
SOUND_ANKI_REGEX = re.compile(r"\[sound:([^\]]+)\]")


class ImportedCard(BaseModel):
    id: int
    front: str
    back: str
    image: Optional[str] = None
    audio: Optional[str] = None
    tags: List[str]
    deckId: Optional[str] = None
    deckName: Optional[str] = None


class AnkiImportResponse(BaseModel):
    cards: List[ImportedCard]


class OfflineTranslationRequest(BaseModel):
    text: str
    source_language: str
    target_language: str


class OfflineTranslationResponse(BaseModel):
    translation: str
    engine: str = "argos"


app = FastAPI(title="LinguaFlow Anki Import API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in DEFAULT_ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict:
    anki_ready = IMPORT_ERROR is None
    argos_ready = ARGOS_IMPORT_ERROR is None and _argos_languages_available()
    return {
        "status": "ok" if anki_ready else "degraded",
        "anki": "ready" if anki_ready else f"error: {IMPORT_ERROR}",
        "argos": "ready" if argos_ready else "missing models or argos-translate",
    }


@app.post("/anki/import", response_model=AnkiImportResponse)
async def import_anki_deck(file: UploadFile = File(...)) -> AnkiImportResponse:
    if IMPORT_ERROR is not None or Collection is None or AnkiPackageImporter is None:
        LOGGER.error("Anki libraries unavailable: %s", IMPORT_ERROR)
        raise HTTPException(status_code=500, detail="Anki libraries are not installed correctly.")

    if not file.filename.lower().endswith(".apkg"):
        raise HTTPException(status_code=400, detail="O arquivo precisa ter extensão .apkg")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Arquivo vazio.")

    with tempfile.TemporaryDirectory(prefix="anki-import-") as tmp_dir:
        tmp_path = Path(tmp_dir)
        apkg_path = tmp_path / file.filename
        apkg_path.write_bytes(contents)

        try:
            cards = _extract_cards_from_apkg(apkg_path)
        except Exception as exc:  # pragma: no cover - best-effort logging
            LOGGER.exception("Failed to import Anki package: %s", exc)
            raise HTTPException(status_code=500, detail=f"Falha ao importar o arquivo: {exc}") from exc

    LOGGER.info("Imported %d cards from %s", len(cards), file.filename)
    return AnkiImportResponse(cards=cards)


@app.post("/translate/offline", response_model=OfflineTranslationResponse)
def translate_offline(payload: OfflineTranslationRequest) -> OfflineTranslationResponse:
    if ARGOS_IMPORT_ERROR is not None or argos_translate is None:
        LOGGER.error("Argos Translate unavailable: %s", ARGOS_IMPORT_ERROR)
        raise HTTPException(status_code=500, detail="Argos Translate não está instalado.")

    text = payload.text.strip()
    if not text:
        return OfflineTranslationResponse(translation="")

    source_code = LANGUAGE_CODE_MAP.get(payload.source_language, payload.source_language.lower()[:2])
    target_code = LANGUAGE_CODE_MAP.get(payload.target_language, payload.target_language.lower()[:2])

    translation = _translate_with_argos(text, source_code, target_code)
    return OfflineTranslationResponse(translation=translation)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _extract_cards_from_apkg(apkg_path: Path) -> List[ImportedCard]:
    """Import the .apkg file into a temporary collection and extract card data."""
    from anki.utils import ids2str  # Imported lazily to avoid loading before libs ready

    with tempfile.TemporaryDirectory(prefix="anki-col-") as col_dir_str:
        col_dir = Path(col_dir_str)
        collection_path = col_dir / "collection.anki2"

        # Create empty collection
        col = Collection(str(collection_path))
        try:
            importer = AnkiPackageImporter(col, str(apkg_path))
            importer.run()

            note_ids = col.find_notes("")
            LOGGER.info("Collection populated with %d notes", len(note_ids))

            cards: List[ImportedCard] = []
            for note_id in note_ids:
                note = col.get_note(note_id)
                if note is None:
                    continue

                model = col.models.get(note.mid)
                field_names = [field["name"] for field in model["flds"]] if model else []
                fields = list(note.fields)

                deck_id, deck_name = _resolve_deck(col, note_id)
                front_index, back_index = _pick_field_indices(field_names)
                front_text = _clean_field(fields, front_index)
                back_text = _clean_field(fields, back_index)

                media_dir = Path(col.media.dir())
                image_data = _extract_first_media(fields, media_dir, is_audio=False)
                audio_data = _extract_first_media(fields, media_dir, is_audio=True)

                cards.append(
                    ImportedCard(
                        id=int(note_id),
                        front=front_text,
                        back=back_text,
                        tags=list(note.tags),
                        deckId=deck_id,
                        deckName=deck_name,
                        image=image_data,
                        audio=audio_data,
                    )
                )
        finally:
            col.close()
            # Clean up collection directory to avoid leaving media behind
            shutil.rmtree(col_dir, ignore_errors=True)

    return cards


def _resolve_deck(col: "Collection", note_id: int) -> tuple[Optional[str], Optional[str]]:
    card_ids = col.find_cards(f"nid:{note_id}")
    if not card_ids:
        return None, None

    card = col.get_card(card_ids[0])
    if card is None:
        return None, None

    deck = col.decks.get(card.did)
    deck_id = str(card.did) if card.did is not None else None
    deck_name = deck.get("name") if deck else None
    return deck_id, deck_name


def _pick_field_indices(field_names: Iterable[str]) -> tuple[int, int]:
    names = [name.lower() for name in field_names]
    candidate_front = ["front", "text", "question", "word", "expression", "english", "inglês", "ingles"]
    candidate_back = ["back", "answer", "meaning", "translation", "portuguese", "português"]

    front_index = next((i for i, name in enumerate(names) if name in candidate_front), 0)
    back_index = next((i for i, name in enumerate(names) if name in candidate_back and i != front_index), 1 if len(names) > 1 else front_index)

    if front_index == back_index and len(names) > 1:
        back_index = 1 if front_index == 0 else 0

    return front_index, back_index


def _clean_field(fields: List[str], index: int) -> str:
    if not fields:
        return ""
    try:
        raw = fields[index]
    except IndexError:
        return ""

    soup = BeautifulSoup(raw or "", "html.parser")
    cleaned = soup.get_text(" ")
    return cleaned.strip()


def _extract_first_media(fields: List[str], media_dir: Path, *, is_audio: bool) -> Optional[str]:
    if not media_dir.exists():
        return None

    matchers = [SOUND_TAG_REGEX, SOUND_ANKI_REGEX] if is_audio else [IMAGE_REGEX]
    for field in fields:
        if not field:
            continue
        for matcher in matchers:
            match = matcher.search(field)
            if not match:
                continue
            filename = match.group(1)
            media_path = _resolve_media_path(media_dir, filename)
            if media_path and media_path.exists():
                return _encode_media(media_path)
    return None


def _resolve_media_path(media_dir: Path, filename: str) -> Optional[Path]:
    candidate = media_dir / filename
    if candidate.exists():
        return candidate

    # Some decks store numeric filenames (media.json maps). Attempt to find by suffix.
    for path in media_dir.iterdir():
        if path.name.lower() == filename.lower():
            return path
    return None


def _encode_media(path: Path) -> str:
    mime, _ = mimetypes.guess_type(path.name)
    mime = mime or ("audio/mpeg" if path.suffix.lower() in {".mp3", ".wav", ".ogg"} else "application/octet-stream")
    data = base64.b64encode(path.read_bytes()).decode("utf-8")
    return f"data:{mime};base64,{data}"


def _translate_with_argos(text: str, source_code: str, target_code: str) -> str:
    installed_languages = argos_translate.get_installed_languages()
    from_lang = next((lang for lang in installed_languages if lang.code == source_code), None)
    if from_lang is None:
        raise HTTPException(status_code=404, detail=f"Modelo Argos para '{source_code}' não instalado.")

    to_lang = next((lang for lang in installed_languages if lang.code == target_code), None)
    if to_lang is None:
        raise HTTPException(status_code=404, detail=f"Modelo Argos para '{target_code}' não instalado.")

    translation_obj = from_lang.get_translation(to_lang)
    if translation_obj is None:
        LOGGER.warning(
            "Argos não possui tradução instalada para %s -> %s",
            source_code,
            target_code,
        )
        raise HTTPException(
            status_code=404,
            detail=(
                "Modelo Argos para a combinação de idiomas "
                f"'{source_code}->{target_code}' não está instalado."
            ),
        )

    translation = translation_obj.translate(text)
    return translation.strip()


def _argos_languages_available() -> bool:
    if argos_translate is None:
        return False
    try:
        return bool(argos_translate.get_installed_languages())
    except Exception:  # pragma: no cover
        return False


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8100, reload=True)
