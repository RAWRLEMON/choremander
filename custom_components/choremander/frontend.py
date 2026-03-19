"""Frontend registration for Choremander custom cards."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Final

from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.components.http import StaticPathConfig
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

# URL base path for serving static files
URL_BASE: Final = "/hacsfiles/choremander"

# List of card files to register as Lovelace resources
CARDS: Final = [
    "choremander-child-card.js",
    "choremander-rewards-card.js",
    "choremander-approvals-card.js",
    "choremander-points-card.js",
    "choremander-reorder-card.js",
]

# JS modules to load globally (for config flow sound preview)
GLOBAL_MODULES: Final = [
    "choremander-config-sounds.js",
]

# Track if frontend is registered
FRONTEND_REGISTERED: Final = "frontend_registered"


def _get_file_version(file_path: Path) -> str:
    """Get cache-busting version from a specific file's mtime.

    Home Assistant reloads the backend on restart, but the browser may keep
    already-loaded ES modules for the lifetime of the open tab.
    Tying `?v=` to the actual JS file mtime ensures the module URL changes
    whenever HACS overwrites the file on disk.
    """
    try:
        return str(int(file_path.stat().st_mtime_ns))
    except OSError:
        return "1"


async def async_register_frontend(hass: HomeAssistant) -> None:
    """Register static paths for serving card JavaScript files."""
    # Only register once
    if hass.data.get(DOMAIN, {}).get(FRONTEND_REGISTERED):
        _LOGGER.debug("Frontend already registered, skipping")
        return

    www_path = Path(__file__).parent / "www"

    if not www_path.exists():
        _LOGGER.warning("www directory not found at %s", www_path)
        return

    # Register the www folder as a static path under /hacsfiles/ for HACS compatibility
    await hass.http.async_register_static_paths(
        [StaticPathConfig(URL_BASE, str(www_path), False)]
    )

    _LOGGER.debug("Registered static path: %s -> %s", URL_BASE, www_path)

    # Register global JS modules (loaded on all pages, including config flow)
    for module in GLOBAL_MODULES:
        module_path = www_path / module
        version = _get_file_version(module_path)
        module_url = f"{URL_BASE}/{module}?v={version}"
        add_extra_js_url(hass, module_url)
        _LOGGER.info("Registered global frontend module: %s", module_url)

    # Mark as registered
    hass.data.setdefault(DOMAIN, {})[FRONTEND_REGISTERED] = True


async def async_register_cards(hass: HomeAssistant) -> None:
    """Register card resources with Lovelace automatically after HA startup.
    
    We use the startup signal to avoid race conditions where Lovelace
    isn't fully loaded yet during config entry setup.
    """

    www_path = Path(__file__).parent / "www"

    @callback
    async def _register_cards_on_startup(event):
        """Register cards once Home Assistant has fully started."""
        lovelace_data = hass.data.get("lovelace")
        if lovelace_data is None:
            _LOGGER.debug("Lovelace not available, cards need manual registration")
            return

        # Get the mode - "storage" or "yaml"
        mode = getattr(lovelace_data, "mode", "storage")

        if mode == "yaml":
            _LOGGER.info(
                "Lovelace is in YAML mode. Add these resources to configuration.yaml:"
            )
            for card in CARDS:
                _LOGGER.info("  - url: %s/%s", URL_BASE, card)
                _LOGGER.info("    type: module")
            return

        # Storage mode - add resources automatically
        try:
            resources = lovelace_data.resources
            if resources is None:
                _LOGGER.debug("Lovelace resources collection not available")
                return

            # Ensure resources are loaded before modification
            await resources.async_load()

            # Get existing resource URLs (strip query params for comparison)
            existing_urls = set()
            for item in resources.async_items():
                url = item.get("url", "")
                existing_urls.add(url.split("?")[0])

            # Register each card
            for card in CARDS:
                card_url = f"{URL_BASE}/{card}"
                card_path = www_path / card
                version = _get_file_version(card_path)
                versioned_url = f"{card_url}?v={version}"

                if card_url in existing_urls:
                    # Update version if needed
                    for item in resources.async_items():
                        if item.get("url", "").split("?")[0] == card_url:
                            if item.get("url") != versioned_url:
                                await resources.async_update_item(
                                    item["id"],
                                    {"url": versioned_url},
                                )
                                _LOGGER.debug(
                                    "Updated card URL: %s -> %s (v=%s)",
                                    item.get("url"),
                                    versioned_url,
                                    version,
                                )
                                _LOGGER.debug("Updated card version: %s", versioned_url)
                            break
                else:
                    await resources.async_create_item(
                        {"url": versioned_url, "res_type": "module"}
                    )
                    _LOGGER.info("Registered Lovelace resource: %s", versioned_url)

        except Exception as err:  # noqa: BLE001
            _LOGGER.debug(
                "Could not auto-register Lovelace resources: %s. "
                "Cards are available at %s/<card-name>.js - add them manually via Settings > Dashboards > Resources.",
                err,
                URL_BASE,
            )
    
    # Register the callback to run after Home Assistant fully starts
    hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _register_cards_on_startup)
