/**
 * Choremander Manage Chores Card
 * Create, edit, and remove chores from a Lovelace card.
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

class ChoremanderManageChoresCard extends LitElement {
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
        --cm-surface-border: 1px solid rgba(255, 255, 255, 0.1);
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
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
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
        color: var(--text-primary-color);
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
        color: #fff;
        font-weight: 600;
        background: var(--primary-color);
      }
    `;
  }

  setConfig(config) {
    if (!config.entity) throw new Error("Please define an entity (sensor.choremander_overview)");
    this.config = { title: "Manage Chores", ...config };
  }

  getCardSize() {
    return 5;
  }

  static getStubConfig() {
    return { entity: "sensor.choremander_overview", title: "Manage Chores" };
  }

  static getConfigElement() {
    return document.createElement("choremander-manage-chores-card-editor");
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const entity = this.hass.states[this.config.entity];
    if (!entity) {
      return html`<ha-card><div class="error-state"><ha-icon icon="mdi:alert-circle"></ha-icon><div>Entity not found: ${this.config.entity}</div></div></ha-card>`;
    }
    const chores = entity.attributes.chores || [];
    const children = entity.attributes.children || [];
    return html`
      <ha-card>
        <div class="card-header">
          <div class="header-content">
            <ha-icon class="header-icon" icon="mdi:clipboard-edit-outline"></ha-icon>
            <span class="header-title">${this.config.title}</span>
          </div>
          <span class="count-chip">${chores.length}</span>
        </div>
        <div class="card-content">
          <div class="toolbar"><button class="primary-button" @click="${() => this._openDialog("add")}">Add Chore</button></div>
          ${chores.length === 0 ? html`<div class="empty-state"><ha-icon icon="mdi:clipboard-plus-outline"></ha-icon><div>No chores yet</div></div>` : chores.map((chore) => this._renderRow(chore, children))}
        </div>
      </ha-card>
      ${this._dialog ? this._renderDialog(children) : ""}
      ${this._notice ? html`<div class="notice">${this._notice.message}</div>` : ""}
    `;
  }

  _getChoreTimeCategories(chore) {
    if (Array.isArray(chore?.time_categories) && chore.time_categories.length > 0) {
      return chore.time_categories.map((c) => String(c).trim().toLowerCase());
    }
    const legacy = String((chore && chore.time_category) || "").trim().toLowerCase();
    if (!legacy) return ["anytime"];
    if (legacy.includes(",")) {
      return legacy.split(",").map((c) => c.trim().toLowerCase()).filter(Boolean);
    }
    return [legacy];
  }

  _formatTimeCategories(chore) {
    const categories = this._getChoreTimeCategories(chore);
    if (categories.length === 1 && categories[0] === "anytime") return "anytime";
    return categories.join(", ");
  }

  _choreMatchesTimeCategory(chore, timeCategory) {
    if (timeCategory === "all") return true;
    const categories = this._getChoreTimeCategories(chore);
    if (categories.includes("anytime")) return true;
    return categories.includes(timeCategory);
  }

  _renderRow(chore, children) {
    const assigned = Array.isArray(chore.assigned_to) ? chore.assigned_to : [];
    const names = assigned.length === 0 ? "All children" : assigned.map((id) => children.find((c) => c.id === id)?.name || id).join(", ");
    const timeLabel = this._formatTimeCategories(chore);
    return html`
      <div class="list-row">
        <div class="row-main">
          <div class="name">${chore.name}</div>
          <div class="sub">${chore.points} pts • ${timeLabel} • ${names}</div>
        </div>
        <div class="row-actions">
          <button class="icon-button" title="Edit chore" @click="${() => this._openDialog("edit", chore)}"><ha-icon icon="mdi:pencil"></ha-icon></button>
          <button class="icon-button danger" title="Remove chore" @click="${() => this._removeChore(chore)}"><ha-icon icon="mdi:trash-can-outline"></ha-icon></button>
        </div>
      </div>
    `;
  }

  _renderDialog(children) {
    const mode = this._dialog.mode;
    const chore = this._dialog.chore || {};
    const assignedSet = new Set(Array.isArray(chore.assigned_to) ? chore.assigned_to : []);
    const selectedCategories = new Set(this._getChoreTimeCategories(chore));
    const timeOptions = ["morning", "afternoon", "evening", "night", "anytime"];
    return html`
      <div class="dialog-overlay" @click="${this._closeDialog}">
        <div class="dialog" @click="${(e) => e.stopPropagation()}">
          <div class="dialog-title">${mode === "add" ? "Add Chore" : "Edit Chore"}</div>
          <div class="form-grid">
            <div class="full"><label>Name</label><input id="name" type="text" .value="${chore.name || ""}" /></div>
            <div><label>Points</label><input id="points" type="number" min="1" .value="${String(chore.points || 10)}" /></div>
            <div class="full">
              <label>Time Categories</label>
              <select id="time_categories" multiple size="5">
                ${timeOptions.map((v) => html`<option value="${v}" ?selected="${selectedCategories.has(v)}">${v}</option>`)}
              </select>
            </div>
            <div><label>Daily Limit</label><input id="daily_limit" type="number" min="1" .value="${String(chore.daily_limit || 1)}" /></div>
            <div><label>Completion %/month</label><input id="completion_percentage_per_month" type="number" min="0" max="100" .value="${String(chore.completion_percentage_per_month ?? 100)}" /></div>
            <div><label>Icon</label><input id="icon" type="text" .value="${chore.icon || "mdi:broom"}" /></div>
            <div><label>Completion Sound</label><input id="completion_sound" type="text" .value="${chore.completion_sound || "coin"}" /></div>
            <div><label>Due days (comma list)</label><input id="due_days" type="text" .value="${Array.isArray(chore.due_days) ? chore.due_days.join(", ") : ""}" /></div>
            <div class="full"><label>Description</label><input id="description" type="text" .value="${chore.description || ""}" /></div>
            <div><label>Requires approval</label><select id="requires_approval"><option value="true" ?selected="${chore.requires_approval !== false}">Yes</option><option value="false" ?selected="${chore.requires_approval === false}">No</option></select></div>
            <div><label>Icon white background</label><select id="icon_white_background"><option value="true" ?selected="${chore.icon_white_background !== false}">Yes</option><option value="false" ?selected="${chore.icon_white_background === false}">No</option></select></div>
            <div class="full">
              <label>Assigned children</label>
              <select id="assigned_to" multiple size="${Math.min(Math.max(children.length, 3), 8)}">
                ${children.map((child) => html`<option value="${child.id}" ?selected="${assignedSet.has(child.id)}">${child.name}</option>`)}
              </select>
            </div>
          </div>
          <div class="dialog-actions">
            <button class="secondary-button" @click="${this._closeDialog}">Cancel</button>
            <button class="primary-button" @click="${() => this._saveDialog(mode, chore)}">${mode === "add" ? "Add" : "Save"}</button>
          </div>
        </div>
      </div>
    `;
  }

  _openDialog(mode, chore = null) {
    this._dialog = { mode, chore };
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

  _parseCsv(value) {
    return (value || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }

  _getSelectedValues(selectEl) {
    return Array.from(selectEl?.selectedOptions || []).map((opt) => opt.value);
  }

  async _saveDialog(mode, chore) {
    const root = this.shadowRoot;
    const name = root.querySelector("#name")?.value?.trim();
    if (!name) {
      this._showNotice("Name is required");
      return;
    }
    const selectedTimeCategories = this._getSelectedValues(root.querySelector("#time_categories"));
    const payload = {
      name,
      points: Number(root.querySelector("#points")?.value || 10),
      description: root.querySelector("#description")?.value || "",
      due_days: this._parseCsv(root.querySelector("#due_days")?.value),
      assigned_to: this._getSelectedValues(root.querySelector("#assigned_to")),
      requires_approval: root.querySelector("#requires_approval")?.value === "true",
      time_categories: selectedTimeCategories.length > 0 ? selectedTimeCategories : ["anytime"],
      daily_limit: Number(root.querySelector("#daily_limit")?.value || 1),
      completion_sound: root.querySelector("#completion_sound")?.value || "coin",
      completion_percentage_per_month: Number(root.querySelector("#completion_percentage_per_month")?.value || 100),
      icon: root.querySelector("#icon")?.value || "mdi:broom",
      icon_white_background: root.querySelector("#icon_white_background")?.value === "true",
    };

    try {
      if (mode === "add") {
        await this.hass.callService("choremander", "add_chore", payload);
        this._showNotice("Chore added");
      } else {
        await this.hass.callService("choremander", "update_chore", { chore_id: chore.id, ...payload });
        this._showNotice("Chore updated");
      }
      this._closeDialog();
    } catch (error) {
      console.error("[Choremander] chore save failed", error);
      this._showNotice(`Failed: ${error.message}`);
    }
  }

  async _removeChore(chore) {
    if (!window.confirm?.(`Remove chore "${chore.name}"?`)) return;
    try {
      await this.hass.callService("choremander", "remove_chore", { chore_id: chore.id });
      this._showNotice("Chore removed");
    } catch (error) {
      console.error("[Choremander] chore delete failed", error);
      this._showNotice(`Failed: ${error.message}`);
    }
  }
}

class ChoremanderManageChoresCardEditor extends LitElement {
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
        <input style="width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--divider-color);border-radius:4px;background:var(--card-background-color);color:var(--primary-text-color);" type="text" .value="${this.config?.title || ""}" @input="${(e) => this._updateConfig("title", e.target.value)}" placeholder="Manage Chores" />
      </div>
    `;
  }

  _updateConfig(key, value) {
    const config = { ...this.config, [key]: value };
    if (value === "") delete config[key];
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }
}

customElements.define("choremander-manage-chores-card", ChoremanderManageChoresCard);
customElements.define("choremander-manage-chores-card-editor", ChoremanderManageChoresCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "choremander-manage-chores-card",
  name: "Choremander Manage Chores",
  description: "Add, edit, and remove chores from a card",
  preview: true,
});
