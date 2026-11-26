"""Bare-`adner` first-run guard.

When the user types ``adner`` with no subcommand, route them to the
chat command if a config exists, otherwise into the init wizard with
the ``--from-bare-adner`` flag (which lets init suppress the
launch-chat prompt and auto-confirm downstream questions).

On an interactive terminal, bare ``adner`` opens the model picker first
(unless ``ADNER_SKIP_MODEL_PICK=1``). Use ``adner --pick-model`` to
force the picker even when that env is set.
"""

from __future__ import annotations

import os
import sys
from typing import TYPE_CHECKING

from adner.core import config as _cfg

if TYPE_CHECKING:
    import click


def check_and_route(ctx: click.Context) -> None:
    """Called from the root group when no subcommand is invoked.

    Returns None and does nothing if a subcommand is being invoked
    (the user typed something specific like ``adner ask``).
    """
    if ctx.invoked_subcommand is not None:
        return

    # Late imports to avoid circular import with cli/__init__.py.
    from adner.cli.chat_cmd import chat as chat_cmd
    from adner.cli.init_cmd import init as init_cmd

    if _cfg.DEFAULT_CONFIG_PATH.exists():
        pick_bare = bool(getattr(ctx, "obj", None) and ctx.obj.get("pick_model_bare"))
        skip = (os.environ.get("ADNER_SKIP_MODEL_PICK", "") or "").strip().lower() in (
            "1",
            "true",
            "yes",
        )
        use_pick = pick_bare or (sys.stdin.isatty() and not skip)
        ctx.invoke(chat_cmd, pick_model=use_pick)
    else:
        ctx.invoke(init_cmd, from_bare_adner=True)
