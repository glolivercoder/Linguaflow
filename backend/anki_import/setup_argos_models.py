"""Utility script to download and install Argos Translate models."""

from __future__ import annotations

import argostranslate.package
import argostranslate.translate


def install_model(from_code: str, to_code: str) -> None:
    """Download and install the first available model for the given language pair."""
    argostranslate.package.update_package_index()
    available_packages = argostranslate.package.get_available_packages()

    try:
        package_to_install = next(
            pkg for pkg in available_packages if pkg.from_code == from_code and pkg.to_code == to_code
        )
    except StopIteration as exc:  # pragma: no cover
        raise RuntimeError(f"No Argos model found for {from_code} -> {to_code}") from exc

    print(f"Installing Argos model {from_code} -> {to_code}...")
    argostranslate.package.install_from_path(package_to_install.download())
    print("Done.")


if __name__ == "__main__":
    # Install Portuguese <-> English models by default
    install_model("pt", "en")
    install_model("en", "pt")
