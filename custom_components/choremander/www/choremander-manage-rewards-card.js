/**
 * Choremander Manage Rewards Card
 * Create, edit, and remove rewards from a Lovelace card.
 */

let LitElement;
const huiMasonry = customElements.get("hui-masonry-view");
const huiView = customElements.get("hui-view");

if (huiMasonry) {
  LitElement = Object.getPrototypeOf(huiMasonry);
} else if (huiView) {
  LitElement = Object.getPrototypeOf(huiView);
} else {
  LitElement = class extends HTMLElement {};
  console.warn("[Choremander] LitElement not found on load. Card may not render correctly.");
}

const html = LitElement.prototype.html || ((strings, ...values) => strings[0]);
const css = LitElement.prototype.css || ((strings, ...values) => strings[0]);

class ChoremanderManageRewardsCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _dialog: { type: Object },
      _notice: { type: Object },
    };
  }

  constructor() {
    super();
    this._dialog = null;
    this._notice = null;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        color-scheme: light dark;
        --cm-surface-border: 1px solid var(--divider-color);
        --cm-surface-radius: 24px;
        --cm-surface-shadow: 0 10px 28px rgba(0, 0, 0, 0.16);
      }

      ha-card {
        overflow: hidden;
        background: var(--ha-card-background, var(--card-background-color));
        border: var(--cm-surface-border);
        border-radius: var(--cm-surface-radius);
        box-shadow: var(--cm-surface-shadow);
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 18px;
        border-bottom: 1px solid var(--divider-color);
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .header-icon {
        --mdc-icon-size: 30px;
        color: var(--primary-color);
      }

      .header-title {
        font-size: 1.12em;
        font-weight: 650;
      }

      .count-chip {
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.85rem;
        font-weight: 650;
        border: 1px solid color-mix(in srgb, var(--primary-color) 28%, transparent);
        background: color-mix(in srgb, var(--primary-color) 14%, transparent);
      }

      .card-content {
        padding: 16px 18px 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .toolbar {
        display: flex;
        justify-content: flex-end;
      }

      .primary-button {
        border: none;
        border-radius: 10px;
        height: 40px;
        padding: 0 14px;
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
        font-weight: 600;
        cursor: pointer;
      }

      .list-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 12px;
        border: 1px solid var(--divider-color);
        border-radius: 14px;
      }

      .row-main {
        min-width: 0;
      }

      .name {
        font-size: 1rem;
        font-weight: 600;
      }

      .sub {
        margin-top: 3px;
        color: var(--secondary-text-color);
        font-size: 0.84rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .row-actions {
        display: flex;
        gap: 8px;
      }

      .icon-button {
        width: 38px;
        height: 38px;
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        cursor: pointer;
      }

      .icon-button.danger {
        color: var(--error-color);
        border-color: color-mix(in srgb, var(--error-color) 45%, transparent);
      }

      .empty-state,
      .error-state {
        text-align: center;
        padding: 36px 18px;
      }

      .empty-state ha-icon,
      .error-state ha-icon {
        --mdc-icon-size: 46px;
        opacity: 0.55;
        margin-bottom: 10px;
      }

      .dialog-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.52);
      }

      .dialog {
        width: min(560px, calc(100vw - 28px));
        background: var(--card-background-color);
        border-radius: 14px;
        padding: 16px;
      }

      .dialog-title {
        font-weight: 700;
        margin-bottom: 12px;
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .full {
        grid-column: 1 / -1;
      }

      label {
        display: block;
        font-size: 0.84rem;
        color: var(--secondary-text-color);
        margin-bottom: 4px;
      }

      input,
      select {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        border-radius: 8px;
        padding: 9px;
      }

      .dialog-actions {
        margin-top: 12px;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .secondary-button {
        border: none;
        border-radius: 8px;
        height: 36px;
        padding: 0 12px;
        cursor: pointer;
        font-weight: 600;
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
      }

      .notice {
        position: fixed;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        padding: 10px 14px;
        border-radius: 8px;
        color: var(--text-primary-color, #fff);
        font-weight: 600;
        background: var(--primary-color);
      }
    `;
  }

  setConfig(config) {
    if (!config.entity) throw new Error("Please define an entity (sensor.choremander_overview)");
    this.config = { title: "Manage Rewards", ...config };
  }

  getCardSize() {
    return 5;
  }

  static getStubConfig() {
    return { entity: "sensor.choremander_overview", title: "Manage Rewards" };
  }

  static getConfigElement() {
    return document.createElement("choremander-manage-rewards-card-editor");
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const entity = this.hass.states[this.config.entity];
    if (!entity) {
      return html`<ha-card><div class="error-state"><ha-icon icon="mdi:alert-circle"></ha-icon><div>Entity not found: ${this.config.entity}</div></div></ha-card>`;
    }
    const rewards = entity.attributes.rewards || [];
    const children = entity.attributes.children || [];
    const pointsName = entity.attributes.points_name || "Points";
    return html`
      <ha-card>
        <div class="card-header">
          <div class="header-content">
            <ha-icon class="header-icon" icon="mdi:gift-outline"></ha-icon>
            <span class="header-title">${this.config.title}</span>
          </div>
          <span class="count-chip">${rewards.length}</span>
        </div>
        <div class="card-content">
          <div class="toolbar"><button class="primary-button" @click="${() => this._openDialog("add")}">Add Reward</button></div>
          ${rewards.length === 0 ? html`<div class="empty-state"><ha-icon icon="mdi:gift-off-outline"></ha-icon><div>No rewards yet</div></div>` : rewards.map((reward) => this._renderRow(reward, children, pointsName))}
        </div>
      </ha-card>
      ${this._dialog ? this._renderDialog(children) : ""}
      ${this._notice ? html`<div class="notice">${this._notice.message}</div>` : ""}
    `;
  }

  _renderRow(reward, children, pointsName) {
    const assigned = Array.isArray(reward.assigned_to) ? reward.assigned_to : [];
    const names = assigned.length === 0 ? "All children" : assigned.map((id) => children.find((c) => c.id === id)?.name || id).join(", ");
    return html`
      <div class="list-row">
        <div class="row-main">
          <div class="name">${reward.name}</div>
          <div class="sub">${reward.cost} ${pointsName} • ${reward.is_jackpot ? "Jackpot" : "Standard"} • ${names}</div>
        </div>
        <div class="row-actions">
          <button class="icon-button" title="Edit reward" @click="${() => this._openDialog("edit", reward)}"><ha-icon icon="mdi:pencil"></ha-icon></button>
          <button class="icon-button danger" title="Remove reward" @click="${() => this._removeReward(reward)}"><ha-icon icon="mdi:trash-can-outline"></ha-icon></button>
        </div>
      </div>
    `;
  }

  _renderDialog(children) {
    const mode = this._dialog.mode;
    const reward = this._dialog.reward || {};
    const assignedSet = new Set(Array.isArray(reward.assigned_to) ? reward.assigned_to : []);
    return html`
      <div class="dialog-overlay" @click="${this._closeDialog}">
        <div class="dialog" @click="${(e) => e.stopPropagation()}">
          <div class="dialog-title">${mode === "add" ? "Add Reward" : "Edit Reward"}</div>
          <div class="form-grid">
            <div class="full"><label>Name</label><input id="name" type="text" .value="${reward.name || ""}" /></div>
            <div><label>Cost</label><input id="cost" type="number" min="1" .value="${String(reward.cost || 50)}" /></div>
            <div><label>Days to goal</label><input id="days_to_goal" type="number" min="1" .value="${String(reward.days_to_goal || 30)}" /></div>
            <div><label>Icon</label><input id="icon" type="text" .value="${reward.icon || "mdi:gift"}" /></div>
            <div>
              <label>Jackpot</label>
              <select id="is_jackpot">
                <option value="false" ?selected="${!reward.is_jackpot}">No</option>
                <option value="true" ?selected="${!!reward.is_jackpot}">Yes</option>
              </select>
            </div>
            <div>
              <label>Override point value</label>
              <select id="override_point_value">
                <option value="false" ?selected="${reward.override_point_value !== true}">No (dynamic)</option>
                <option value="true" ?selected="${reward.override_point_value === true}">Yes (manual cost)</option>
              </select>
            </div>
            <div class="full"><label>Description</label><input id="description" type="text" .value="${reward.description || ""}" /></div>
            <div class="full">
              <label>Assigned children</label>
              <select id="assigned_to" multiple size="${Math.min(Math.max(children.length, 3), 8)}">
                ${children.map((child) => html`<option value="${child.id}" ?selected="${assignedSet.has(child.id)}">${child.name}</option>`)}
              </select>
            </div>
          </div>
          <div class="dialog-actions">
            <button class="secondary-button" @click="${this._closeDialog}">Cancel</button>
            <button class="primary-button" @click="${() => this._saveDialog(mode, reward)}">${mode === "add" ? "Add" : "Save"}</button>
          </div>
        </div>
      </div>
    `;
  }

  _openDialog(mode, reward = null) {
    this._dialog = { mode, reward };
  }

  _closeDialog() {
    this._dialog = null;
  }

  _showNotice(message) {
    this._notice = { message };
    clearTimeout(this._noticeTimer);
    this._noticeTimer = setTimeout(() => {
      this._notice = null;
      this.requestUpdate();
    }, 2300);
  }

  _getSelectedValues(selectEl) {
    return Array.from(selectEl?.selectedOptions || []).map((opt) => opt.value);
  }

  async _saveDialog(mode, reward) {
    const root = this.shadowRoot;
    const name = root.querySelector("#name")?.value?.trim();
    if (!name) {
      this._showNotice("Name is required");
      return;
    }

    const payload = {
      name,
      cost: Number(root.querySelector("#cost")?.value || 50),
      description: root.querySelector("#description")?.value || "",
      icon: root.querySelector("#icon")?.value || "mdi:gift",
      assigned_to: this._getSelectedValues(root.querySelector("#assigned_to")),
      is_jackpot: root.querySelector("#is_jackpot")?.value === "true",
      override_point_value: root.querySelector("#override_point_value")?.value === "true",
      days_to_goal: Number(root.querySelector("#days_to_goal")?.value || 30),
    };

    try {
      if (mode === "add") {
        await this.hass.callService("choremander", "add_reward", payload);
        this._showNotice("Reward added");
      } else {
        await this.hass.callService("choremander", "update_reward", { reward_id: reward.id, ...payload });
        this._showNotice("Reward updated");
      }
      this._closeDialog();
    } catch (error) {
      console.error("[Choremander] reward save failed", error);
      this._showNotice(`Failed: ${error.message}`);
    }
  }

  async _removeReward(reward) {
    if (!window.confirm?.(`Remove reward "${reward.name}"?`)) return;
    try {
      await this.hass.callService("choremander", "remove_reward", { reward_id: reward.id });
      this._showNotice("Reward removed");
    } catch (error) {
      console.error("[Choremander] reward delete failed", error);
      this._showNotice(`Failed: ${error.message}`);
    }
  }
}

class ChoremanderManageRewardsCardEditor extends LitElement {
  static get properties() {
    return { config: { type: Object } };
  }

  setConfig(config) {
    this.config = config;
  }

  render() {
    return html`
      <div style="margin-bottom:16px;">
        <label style="display:block;margin-bottom:4px;font-weight:500;">Entity</label>
        <input style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--divider-color);border-radius:4px;background:var(--card-background-color);color:var(--primary-text-color);" type="text" .value="${this.config?.entity || ""}" @input="${(e) => this._updateConfig("entity", e.target.value)}" placeholder="sensor.choremander_overview" />
      </div>
      <div>
        <label style="display:block;margin-bottom:4px;font-weight:500;">Title</label>
        <input style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--divider-color);border-radius:4px;background:var(--card-background-color);color:var(--primary-text-color);" type="text" .value="${this.config?.title || ""}" @input="${(e) => this._updateConfig("title", e.target.value)}" placeholder="Manage Rewards" />
      </div>
    `;
  }

  _updateConfig(key, value) {
    const config = { ...this.config, [key]: value };
    if (value === "") delete config[key];
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }
}

customElements.define("choremander-manage-rewards-card", ChoremanderManageRewardsCard);
customElements.define("choremander-manage-rewards-card-editor", ChoremanderManageRewardsCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "choremander-manage-rewards-card",
  name: "Choremander Manage Rewards",
  description: "Add, edit, and remove rewards from a card",
  preview: true,
});
