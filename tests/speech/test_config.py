"""Tests for speech configuration."""

from adner.core.config import AdnerConfig, SpeechConfig


def test_speech_config_defaults():
    cfg = SpeechConfig()
    assert cfg.backend == "auto"
    assert cfg.model == "base"
    assert cfg.language == ""
    assert cfg.device == "auto"
    assert cfg.compute_type == "float16"


def test_adner_config_has_speech():
    cfg = AdnerConfig()
    assert hasattr(cfg, "speech")
    assert isinstance(cfg.speech, SpeechConfig)
    assert cfg.speech.backend == "auto"


def test_adner_system_has_speech_backend():
    """AdnerSystem has a speech_backend attribute."""
    from adner.system import AdnerSystem

    assert "speech_backend" in AdnerSystem.__dataclass_fields__
