"""Choremander - Family Chore Manager for Home Assistant."""
from __future__ import annotations

import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall
import voluptuous as vol
from homeassistant.helpers import config_validation as cv

from .const import (
    ATTR_ASSIGNED_TO,
    ATTR_AVATAR,
    ATTR_CHILD_ID,
    ATTR_CHORE_ID,
    ATTR_CHORE_ORDER,
    ATTR_COMPLETION_PERCENTAGE_PER_MONTH,
    ATTR_COMPLETION_SOUND,
    ATTR_COST,
    ATTR_DAILY_LIMIT,
    ATTR_DAYS_TO_GOAL,
    ATTR_DESCRIPTION,
    ATTR_DUE_DAYS,
    ATTR_ICON,
    ATTR_ICON_WHITE_BACKGROUND,
    ATTR_IS_JACKPOT,
    ATTR_NAME,
    ATTR_OVERRIDE_POINT_VALUE,
    ATTR_POINTS,
    ATTR_REASON,
    ATTR_REQUIRES_APPROVAL,
    ATTR_REWARD_ID,
    ATTR_TIME_CATEGORY,
    ATTR_TIME_CATEGORIES,
    DOMAIN,
    SERVICE_ADD_CHILD,
    SERVICE_ADD_CHORE,
    SERVICE_ADD_POINTS,
    SERVICE_ADD_REWARD,
    SERVICE_APPROVE_CHORE,
    SERVICE_APPROVE_REWARD,
    SERVICE_CLAIM_REWARD,
    SERVICE_COMPLETE_CHORE,
    SERVICE_REJECT_CHORE,
    SERVICE_REMOVE_CHILD,
    SERVICE_REMOVE_CHORE,
    SERVICE_REMOVE_POINTS,
    SERVICE_REMOVE_REWARD,
    SERVICE_SET_CHORE_ORDER,
    SERVICE_UPDATE_CHILD,
    SERVICE_UPDATE_CHORE,
    SERVICE_UPDATE_REWARD,
)
from .coordinator import ChoremanderCoordinator
from .models import Child, Chore, Reward, normalize_time_categories
from .frontend import async_register_cards, async_register_frontend

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.SENSOR, Platform.BUTTON, Platform.BINARY_SENSOR]

# Track if services are registered
SERVICES_REGISTERED = "services_registered"


def _resolve_time_categories(data: dict[str, Any], default: list[str] | None = None) -> list[str]:
    """Resolve time categories from service call data (supports legacy single value)."""
    if ATTR_TIME_CATEGORIES in data:
        return normalize_time_categories(data[ATTR_TIME_CATEGORIES])
    if ATTR_TIME_CATEGORY in data:
        return normalize_time_categories(data[ATTR_TIME_CATEGORY])
    return normalize_time_categories(default)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Choremander from a config entry."""
    hass.data.setdefault(DOMAIN, {})

    coordinator = ChoremanderCoordinator(hass, entry.entry_id)
    await coordinator.async_initialize()

    # Store initial settings from config entry
    if entry.data.get("points_name"):
        coordinator.storage.set_points_name(entry.data["points_name"])
    if entry.data.get("points_icon"):
        coordinator.storage.set_points_icon(entry.data["points_icon"])
    await coordinator.storage.async_save()

    hass.data[DOMAIN][entry.entry_id] = coordinator

    # Register frontend static paths and Lovelace resources (only once)
    await async_register_frontend(hass)
    await async_register_cards(hass)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Register services (only once)
    if not hass.data[DOMAIN].get(SERVICES_REGISTERED):
        await _async_register_services(hass)
        hass.data[DOMAIN][SERVICES_REGISTERED] = True

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        hass.data[DOMAIN].pop(entry.entry_id)

        # If no more entries, unregister services
        remaining_entries = [
            key for key in hass.data[DOMAIN].keys() if key != SERVICES_REGISTERED
        ]
        if not remaining_entries:
            _async_unregister_services(hass)
            hass.data[DOMAIN][SERVICES_REGISTERED] = False

    return unload_ok


def _get_coordinator(hass: HomeAssistant) -> ChoremanderCoordinator | None:
    """Get the first available coordinator."""
    for key, value in hass.data.get(DOMAIN, {}).items():
        if key != SERVICES_REGISTERED and isinstance(value, ChoremanderCoordinator):
            return value
    return None


async def _async_register_services(hass: HomeAssistant) -> None:
    """Register Choremander services."""

    async def handle_complete_chore(call: ServiceCall) -> None:
        """Handle the complete_chore service call."""
        coordinator = _get_coordinator(hass)
        if not coordinator:
            _LOGGER.error("No Choremander coordinator available")
            return
        chore_id = call.data[ATTR_CHORE_ID]
        child_id = call.data[ATTR_CHILD_ID]
        await coordinator.async_complete_chore(chore_id, child_id)

    async def handle_approve_chore(call: ServiceCall) -> None:
        """Handle the approve_chore service call."""
        coordinator = _get_coordinator(hass)
        if not coordinator:
            _LOGGER.error("No Choremander coordinator available")
            return
        completion_id = call.data["completion_id"]
        await coordinator.async_approve_chore(completion_id)

    async def handle_reject_chore(call: ServiceCall) -> None:
        """Handle the reject_chore service call."""
        coordinator = _get_coordinator(hass)
        if not coordinator:
            _LOGGER.error("No Choremander coordinator available")
            return
        completion_id = call.data["completion_id"]
        await coordinator.async_reject_chore(completion_id)

    async def handle_claim_reward(call: ServiceCall) -> None:
        """Handle the claim_reward service call."""
        coordinator = _get_coordinator(hass)
        if not coordinator:
            _LOGGER.error("No Choremander coordinator available")
            return
        reward_id = call.data[ATTR_REWARD_ID]
        child_id = call.data[ATTR_CHILD_ID]
        await coordinator.async_claim_reward(reward_id, child_id)

    async def handle_approve_reward(call: ServiceCall) -> None:
        """Handle the approve_reward service call."""
        coordinator = _get_coordinator(hass)
        if not coordinator:
            _LOGGER.error("No Choremander coordinator available")
            return
        claim_id = call.data["claim_id"]
        await coordinator.async_approve_reward(claim_id)

    async def handle_add_points(call: ServiceCall) -> None:
        """Handle the add_points service call."""
        coordinator = _get_coordinator(hass)
        if not coordinator:
            _LOGGER.error("No Choremander coordinator available")
            return
        child_id = call.data[ATTR_CHILD_ID]
        points = call.data[ATTR_POINTS]
        reason = call.data.get(ATTR_REASON, "")
        await coordinator.async_add_points(child_id, points, reason)

    async def handle_remove_points(call: ServiceCall) -> None:
        """Handle the remove_points service call."""
        coordinator = _get_coordinator(hass)
        if not coordinator:
            _LOGGER.error("No Choremander coordinator available")
            return
        child_id = call.data[ATTR_CHILD_ID]
        points = call.data[ATTR_POINTS]
        reason = call.data.get(ATTR_REASON, "")
        await coordinator.async_remove_points(child_id, points, reason)

    async def handle_set_chore_order(call: ServiceCall) -> None:
        """Handle the set_chore_order service call."""
        coordinator = _get_coordinator(hass)
        if not coordinator:
            _LOGGER.error("No Choremander coordinator available")
            return
        child_id = call.data[ATTR_CHILD_ID]
        chore_order = call.data[ATTR_CHORE_ORDER]
        await coordinator.async_set_chore_order(child_id, chore_order)

    async def handle_add_child(call: ServiceCall) -> None:
        """Handle the add_child service call."""
        coordinator = _get_coordinator(hass)
        if not coordinator:
            _LOGGER.error("No Choremander coordinator available")
            return
        await coordinator.async_add_child(
            name=call.data[ATTR_NAME],
            avatar=call.data.get(ATTR_AVATAR, "mdi:account-circle"),
        )

    async def handle_update_child(call: ServiceCall) -> None:
        """Handle the update_child service call."""
        coordinator = _get_coordinator(hass)
        if not coordinator:
            _LOGGER.error("No Choremander coordinator available")
            return
        child_id = call.data[ATTR_CHILD_ID]
        child = coordinator.get_child(child_id)
        if not child:
            _LOGGER.error("Child not found: %s", child_id)
            return

        updated_child = Child(
            id=child.id,
            name=call.data.get(ATTR_NAME, child.name),
            avatar=call.data.get(ATTR_AVATAR, child.avatar),
            points=child.points,
            total_points_earned=child.total_points_earned,
            total_chores_completed=child.total_chores_completed,
            current_streak=child.current_streak,
            best_streak=child.best_streak,
            pending_rewards=child.pending_rewards,
            chore_order=child.chore_order,
        )
        await coordinator.async_update_child(updated_child)

    async def handle_remove_child(call: ServiceCall) -> None:
        """Handle the remove_child service call."""
        coordinator = _get_coordinator(hass)
        if not coordinator:
            _LOGGER.error("No Choremander coordinator available")
            return
        await coordinator.async_remove_child(call.data[ATTR_CHILD_ID])

    async def handle_add_chore(call: ServiceCall) -> None:
        """Handle the add_chore service call."""
        coordinator = _get_coordinator(hass)
        if not coordinator:
            _LOGGER.error("No Choremander coordinator available")
            return
        await coordinator.async_add_chore(
            name=call.data[ATTR_NAME],
            points=call.data.get(ATTR_POINTS, 10),
            description=call.data.get(ATTR_DESCRIPTION, ""),
            due_days=call.data.get(ATTR_DUE_DAYS, []),
            assigned_to=call.data.get(ATTR_ASSIGNED_TO, []),
            requires_approval=call.data.get(ATTR_REQUIRES_APPROVAL, True),
            time_categories=_resolve_time_categories(call.data, ["anytime"]),
            daily_limit=call.data.get(ATTR_DAILY_LIMIT, 1),
            completion_sound=call.data.get(ATTR_COMPLETION_SOUND, "coin"),
            completion_percentage_per_month=call.data.get(ATTR_COMPLETION_PERCENTAGE_PER_MONTH, 100),
            icon=call.data.get(ATTR_ICON, "mdi:broom"),
            icon_white_background=call.data.get(ATTR_ICON_WHITE_BACKGROUND, True),
        )

    async def handle_update_chore(call: ServiceCall) -> None:
        """Handle the update_chore service call."""
        coordinator = _get_coordinator(hass)
        if not coordinator:
            _LOGGER.error("No Choremander coordinator available")
            return
        chore_id = call.data[ATTR_CHORE_ID]
        chore = coordinator.get_chore(chore_id)
        if not chore:
            _LOGGER.error("Chore not found: %s", chore_id)
            return

        updated_chore = Chore(
            id=chore.id,
            name=call.data.get(ATTR_NAME, chore.name),
            points=call.data.get(ATTR_POINTS, chore.points),
            description=call.data.get(ATTR_DESCRIPTION, chore.description),
            due_days=call.data.get(ATTR_DUE_DAYS, chore.due_days),
            assigned_to=call.data.get(ATTR_ASSIGNED_TO, chore.assigned_to),
            requires_approval=call.data.get(ATTR_REQUIRES_APPROVAL, chore.requires_approval),
            time_categories=_resolve_time_categories(call.data, chore.time_categories),
            daily_limit=call.data.get(ATTR_DAILY_LIMIT, chore.daily_limit),
            completion_sound=call.data.get(ATTR_COMPLETION_SOUND, chore.completion_sound),
            completion_percentage_per_month=call.data.get(
                ATTR_COMPLETION_PERCENTAGE_PER_MONTH,
                chore.completion_percentage_per_month,
            ),
            icon=call.data.get(ATTR_ICON, chore.icon),
            icon_white_background=call.data.get(ATTR_ICON_WHITE_BACKGROUND, chore.icon_white_background),
        )
        await coordinator.async_update_chore(updated_chore)

    async def handle_remove_chore(call: ServiceCall) -> None:
        """Handle the remove_chore service call."""
        coordinator = _get_coordinator(hass)
        if not coordinator:
            _LOGGER.error("No Choremander coordinator available")
            return
        await coordinator.async_remove_chore(call.data[ATTR_CHORE_ID])

    async def handle_add_reward(call: ServiceCall) -> None:
        """Handle the add_reward service call."""
        coordinator = _get_coordinator(hass)
        if not coordinator:
            _LOGGER.error("No Choremander coordinator available")
            return
        await coordinator.async_add_reward(
            name=call.data[ATTR_NAME],
            cost=call.data.get(ATTR_COST, 50),
            description=call.data.get(ATTR_DESCRIPTION, ""),
            icon=call.data.get(ATTR_ICON, "mdi:gift"),
            assigned_to=call.data.get(ATTR_ASSIGNED_TO, []),
            is_jackpot=call.data.get(ATTR_IS_JACKPOT, False),
            override_point_value=call.data.get(ATTR_OVERRIDE_POINT_VALUE, False),
            days_to_goal=call.data.get(ATTR_DAYS_TO_GOAL, 30),
        )

    async def handle_update_reward(call: ServiceCall) -> None:
        """Handle the update_reward service call."""
        coordinator = _get_coordinator(hass)
        if not coordinator:
            _LOGGER.error("No Choremander coordinator available")
            return
        reward_id = call.data[ATTR_REWARD_ID]
        reward = coordinator.get_reward(reward_id)
        if not reward:
            _LOGGER.error("Reward not found: %s", reward_id)
            return

        updated_reward = Reward(
            id=reward.id,
            name=call.data.get(ATTR_NAME, reward.name),
            cost=call.data.get(ATTR_COST, reward.cost),
            description=call.data.get(ATTR_DESCRIPTION, reward.description),
            icon=call.data.get(ATTR_ICON, reward.icon),
            assigned_to=call.data.get(ATTR_ASSIGNED_TO, reward.assigned_to),
            is_jackpot=call.data.get(ATTR_IS_JACKPOT, reward.is_jackpot),
            override_point_value=call.data.get(ATTR_OVERRIDE_POINT_VALUE, reward.override_point_value),
            days_to_goal=call.data.get(ATTR_DAYS_TO_GOAL, reward.days_to_goal),
        )
        await coordinator.async_update_reward(updated_reward)

    async def handle_remove_reward(call: ServiceCall) -> None:
        """Handle the remove_reward service call."""
        coordinator = _get_coordinator(hass)
        if not coordinator:
            _LOGGER.error("No Choremander coordinator available")
            return
        await coordinator.async_remove_reward(call.data[ATTR_REWARD_ID])

    # Register all services
    hass.services.async_register(
        DOMAIN,
        SERVICE_COMPLETE_CHORE,
        handle_complete_chore,
        schema=vol.Schema(
            {
                vol.Required(ATTR_CHORE_ID): cv.string,
                vol.Required(ATTR_CHILD_ID): cv.string,
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_APPROVE_CHORE,
        handle_approve_chore,
        schema=vol.Schema(
            {
                vol.Required("completion_id"): cv.string,
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_REJECT_CHORE,
        handle_reject_chore,
        schema=vol.Schema(
            {
                vol.Required("completion_id"): cv.string,
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_CLAIM_REWARD,
        handle_claim_reward,
        schema=vol.Schema(
            {
                vol.Required(ATTR_REWARD_ID): cv.string,
                vol.Required(ATTR_CHILD_ID): cv.string,
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_APPROVE_REWARD,
        handle_approve_reward,
        schema=vol.Schema(
            {
                vol.Required("claim_id"): cv.string,
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_ADD_POINTS,
        handle_add_points,
        schema=vol.Schema(
            {
                vol.Required(ATTR_CHILD_ID): cv.string,
                vol.Required(ATTR_POINTS): cv.positive_int,
                vol.Optional(ATTR_REASON, default=""): cv.string,
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_REMOVE_POINTS,
        handle_remove_points,
        schema=vol.Schema(
            {
                vol.Required(ATTR_CHILD_ID): cv.string,
                vol.Required(ATTR_POINTS): cv.positive_int,
                vol.Optional(ATTR_REASON, default=""): cv.string,
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_SET_CHORE_ORDER,
        handle_set_chore_order,
        schema=vol.Schema(
            {
                vol.Required(ATTR_CHILD_ID): cv.string,
                vol.Required(ATTR_CHORE_ORDER): vol.All(cv.ensure_list, [cv.string]),
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_ADD_CHILD,
        handle_add_child,
        schema=vol.Schema(
            {
                vol.Required(ATTR_NAME): cv.string,
                vol.Optional(ATTR_AVATAR, default="mdi:account-circle"): cv.string,
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_UPDATE_CHILD,
        handle_update_child,
        schema=vol.Schema(
            {
                vol.Required(ATTR_CHILD_ID): cv.string,
                vol.Optional(ATTR_NAME): cv.string,
                vol.Optional(ATTR_AVATAR): cv.string,
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_REMOVE_CHILD,
        handle_remove_child,
        schema=vol.Schema({vol.Required(ATTR_CHILD_ID): cv.string}),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_ADD_CHORE,
        handle_add_chore,
        schema=vol.Schema(
            {
                vol.Required(ATTR_NAME): cv.string,
                vol.Optional(ATTR_POINTS, default=10): cv.positive_int,
                vol.Optional(ATTR_DESCRIPTION, default=""): cv.string,
                vol.Optional(ATTR_DUE_DAYS, default=[]): vol.All(cv.ensure_list, [cv.string]),
                vol.Optional(ATTR_ASSIGNED_TO, default=[]): vol.All(cv.ensure_list, [cv.string]),
                vol.Optional(ATTR_REQUIRES_APPROVAL, default=True): cv.boolean,
                vol.Optional(ATTR_TIME_CATEGORY): cv.string,
                vol.Optional(ATTR_TIME_CATEGORIES): vol.All(cv.ensure_list, [cv.string]),
                vol.Optional(ATTR_DAILY_LIMIT, default=1): cv.positive_int,
                vol.Optional(ATTR_COMPLETION_SOUND, default="coin"): cv.string,
                vol.Optional(ATTR_COMPLETION_PERCENTAGE_PER_MONTH, default=100): vol.All(
                    vol.Coerce(int),
                    vol.Range(min=0, max=100),
                ),
                vol.Optional(ATTR_ICON, default="mdi:broom"): cv.string,
                vol.Optional(ATTR_ICON_WHITE_BACKGROUND, default=True): cv.boolean,
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_UPDATE_CHORE,
        handle_update_chore,
        schema=vol.Schema(
            {
                vol.Required(ATTR_CHORE_ID): cv.string,
                vol.Optional(ATTR_NAME): cv.string,
                vol.Optional(ATTR_POINTS): cv.positive_int,
                vol.Optional(ATTR_DESCRIPTION): cv.string,
                vol.Optional(ATTR_DUE_DAYS): vol.All(cv.ensure_list, [cv.string]),
                vol.Optional(ATTR_ASSIGNED_TO): vol.All(cv.ensure_list, [cv.string]),
                vol.Optional(ATTR_REQUIRES_APPROVAL): cv.boolean,
                vol.Optional(ATTR_TIME_CATEGORY): cv.string,
                vol.Optional(ATTR_TIME_CATEGORIES): vol.All(cv.ensure_list, [cv.string]),
                vol.Optional(ATTR_DAILY_LIMIT): cv.positive_int,
                vol.Optional(ATTR_COMPLETION_SOUND): cv.string,
                vol.Optional(ATTR_COMPLETION_PERCENTAGE_PER_MONTH): vol.All(
                    vol.Coerce(int),
                    vol.Range(min=0, max=100),
                ),
                vol.Optional(ATTR_ICON): cv.string,
                vol.Optional(ATTR_ICON_WHITE_BACKGROUND): cv.boolean,
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_REMOVE_CHORE,
        handle_remove_chore,
        schema=vol.Schema({vol.Required(ATTR_CHORE_ID): cv.string}),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_ADD_REWARD,
        handle_add_reward,
        schema=vol.Schema(
            {
                vol.Required(ATTR_NAME): cv.string,
                vol.Optional(ATTR_COST, default=50): cv.positive_int,
                vol.Optional(ATTR_DESCRIPTION, default=""): cv.string,
                vol.Optional(ATTR_ICON, default="mdi:gift"): cv.string,
                vol.Optional(ATTR_ASSIGNED_TO, default=[]): vol.All(cv.ensure_list, [cv.string]),
                vol.Optional(ATTR_IS_JACKPOT, default=False): cv.boolean,
                vol.Optional(ATTR_OVERRIDE_POINT_VALUE, default=False): cv.boolean,
                vol.Optional(ATTR_DAYS_TO_GOAL, default=30): cv.positive_int,
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_UPDATE_REWARD,
        handle_update_reward,
        schema=vol.Schema(
            {
                vol.Required(ATTR_REWARD_ID): cv.string,
                vol.Optional(ATTR_NAME): cv.string,
                vol.Optional(ATTR_COST): cv.positive_int,
                vol.Optional(ATTR_DESCRIPTION): cv.string,
                vol.Optional(ATTR_ICON): cv.string,
                vol.Optional(ATTR_ASSIGNED_TO): vol.All(cv.ensure_list, [cv.string]),
                vol.Optional(ATTR_IS_JACKPOT): cv.boolean,
                vol.Optional(ATTR_OVERRIDE_POINT_VALUE): cv.boolean,
                vol.Optional(ATTR_DAYS_TO_GOAL): cv.positive_int,
            }
        ),
    )

    hass.services.async_register(
        DOMAIN,
        SERVICE_REMOVE_REWARD,
        handle_remove_reward,
        schema=vol.Schema({vol.Required(ATTR_REWARD_ID): cv.string}),
    )


def _async_unregister_services(hass: HomeAssistant) -> None:
    """Unregister Choremander services."""
    services = [
        SERVICE_COMPLETE_CHORE,
        SERVICE_APPROVE_CHORE,
        SERVICE_REJECT_CHORE,
        SERVICE_CLAIM_REWARD,
        SERVICE_APPROVE_REWARD,
        SERVICE_ADD_POINTS,
        SERVICE_REMOVE_POINTS,
        SERVICE_SET_CHORE_ORDER,
        SERVICE_ADD_CHILD,
        SERVICE_UPDATE_CHILD,
        SERVICE_REMOVE_CHILD,
        SERVICE_ADD_CHORE,
        SERVICE_UPDATE_CHORE,
        SERVICE_REMOVE_CHORE,
        SERVICE_ADD_REWARD,
        SERVICE_UPDATE_REWARD,
        SERVICE_REMOVE_REWARD,
    ]
    for service in services:
        hass.services.async_remove(DOMAIN, service)
