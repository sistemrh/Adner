"""Smoke test that the tmp_adner_home fixture works."""

from __future__ import annotations

from pathlib import Path

from adner.core import config as config_mod


def test_fixture_redirects_default_config_dir(tmp_adner_home: Path) -> None:
    assert config_mod.DEFAULT_CONFIG_DIR == tmp_adner_home
    assert tmp_adner_home.exists()
    assert (tmp_adner_home / ".state").exists()
    assert (tmp_adner_home / ".state" / "models").exists()


def test_fixture_redirects_config_path(tmp_adner_home: Path) -> None:
    assert config_mod.DEFAULT_CONFIG_PATH == tmp_adner_home / "config.toml"
