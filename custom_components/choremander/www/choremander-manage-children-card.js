/**
 * Choremander Manage Children Card
 * Create, edit, and remove child profiles from a Lovelace card.
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

class ChoremanderManageChildrenCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _dialog: { type: Object },
      _loading: { type: Object },
      _notice: { type: Object },
    };
  }

  constructor() {
    super();
    this._dialog = null;
    this._loading = {};
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
        color: var(--primary-text-color);
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
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .avatar {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, var(--primary-color) 15%, transparent);
        border: 1px solid color-mix(in srgb, var(--primary-color) 28%, transparent);
      }

      .avatar ha-icon {
        --mdc-icon-size: 26px;
        color: var(--primary-color);
      }

      .meta {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .name {
        font-size: 1rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .sub {
        font-size: 0.86rem;
        color: var(--secondary-text-color);
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

      .icon-button ha-icon {
        --mdc-icon-size: 20px;
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
        width: min(460px, calc(100vw - 28px));
        background: var(--card-background-color);
        border-radius: 14px;
        padding: 16px;
      }

      .dialog-title {
        font-weight: 700;
        margin-bottom: 12px;
      }

      .form {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      label {
        font-size: 0.84rem;
        color: var(--secondary-text-color);
      }

      input {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        border-radius: 8px;
        padding: 10px;
      }

      .dialog-actions {
        margin-top: 12px;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .secondary-button,
      .danger-button {
        border: none;
        border-radius: 8px;
        height: 36px;
        padding: 0 12px;
        cursor: pointer;
        font-weight: 600;
      }

      .secondary-button {
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
      }

      .danger-button {
        background: var(--error-color);
        color: var(--text-primary-color, #fff);
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
    if (!config.entity) {
      throw new Error("Please define an entity (sensor.choremander_overview)");
    }
    this.config = { title: "Manage Children", ...config };
  }

  getCardSize() {
    return 4;
  }

  static getStubConfig() {
    return { entity: "sensor.choremander_overview", title: "Manage Children" };
  }

  static getConfigElement() {
    return document.createElement("choremander-manage-children-card-editor");
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const entity = this.hass.states[this.config.entity];
    if (!entity) {
      return html`<ha-card><div class="error-state"><ha-icon icon="mdi:alert-circle"></ha-icon><div>Entity not found: ${this.config.entity}</div></div></ha-card>`;
    }

    const children = entity.attributes.children || [];
    return html`
      <ha-card>
        <div class="card-header">
          <div class="header-content">
            <ha-icon class="header-icon" icon="mdi:account-group"></ha-icon>
            <span class="header-title">${this.config.title}</span>
          </div>
          <span class="count-chip">${children.length}</span>
        </div>
        <div class="card-content">
          <div class="toolbar">
            <button class="primary-button" @click="${() => this._openDialog("add")}">Add Child</button>
          </div>
          ${children.length === 0
            ? html`<div class="empty-state"><ha-icon icon="mdi:account-plus-outline"></ha-icon><div>No children yet</div></div>`
            : children.map((child) => this._renderRow(child))}
        </div>
      </ha-card>
      ${this._dialog ? this._renderDialog() : ""}
      ${this._notice ? html`<div class="notice">${this._notice.message}</div>` : ""}
    `;
  }

  _renderRow(child) {
    return html`
      <div class="list-row">
        <div class="row-main">
          <div class="avatar"><ha-icon icon="${child.avatar || "mdi:account-circle"}"></ha-icon></div>
          <div class="meta">
            <div class="name">${child.name}</div>
            <div class="sub">${child.points || 0} points</div>
          </div>
        </div>
        <div class="row-actions">
          <button class="icon-button" title="Edit child" @click="${() => this._openDialog("edit", child)}">
            <ha-icon icon="mdi:pencil"></ha-icon>
          </button>
          <button class="icon-button danger" title="Remove child" @click="${() => this._removeChild(child)}">
            <ha-icon icon="mdi:trash-can-outline"></ha-icon>
          </button>
        </div>
      </div>
    `;
  }

  _renderDialog() {
    const mode = this._dialog.mode;
    const child = this._dialog.child || {};
    return html`
      <div class="dialog-overlay" @click="${this._closeDialog}">
        <div class="dialog" @click="${(e) => e.stopPropagation()}">
          <div class="dialog-title">${mode === "add" ? "Add Child" : "Edit Child"}</div>
          <div class="form">
            <div>
              <label>Name</label>
              <input id="child-name" type="text" .value="${child.name || ""}" />
            </div>
            <div>
              <label>Avatar (mdi icon)</label>
              <input id="child-avatar" type="text" .value="${child.avatar || "mdi:account-circle"}" />
            </div>
          </div>
          <div class="dialog-actions">
            <button class="secondary-button" @click="${this._closeDialog}">Cancel</button>
            <button class="primary-button" @click="${() => this._saveDialog(mode, child)}">${mode === "add" ? "Add" : "Save"}</button>
          </div>
        </div>
      </div>
    `;
  }

  _openDialog(mode, child = null) {
    this._dialog = { mode, child };
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
    }, 2200);
  }

  async _saveDialog(mode, child) {
    const name = this.shadowRoot.querySelector("#child-name")?.value?.trim();
    const avatar = this.shadowRoot.querySelector("#child-avatar")?.value?.trim() || "mdi:account-circle";
    if (!name) {
      this._showNotice("Name is required");
      return;
    }
    try {
      if (mode === "add") {
        await this.hass.callService("choremander", "add_child", { name, avatar });
        this._showNotice("Child added");
      } else {
        await this.hass.callService("choremander", "update_child", { child_id: child.id, name, avatar });
        this._showNotice("Child updated");
      }
      this._closeDialog();
    } catch (error) {
      console.error("[Choremander] child save failed", error);
      this._showNotice(`Failed: ${error.message}`);
    }
  }

  async _removeChild(child) {
    if (!window.confirm?.(`Remove ${child.name}?`)) return;
    try {
      await this.hass.callService("choremander", "remove_child", { child_id: child.id });
      this._showNotice("Child removed");
    } catch (error) {
      console.error("[Choremander] child delete failed", error);
      this._showNotice(`Failed: ${error.message}`);
    }
  }
}

class ChoremanderManageChildrenCardEditor extends LitElement {
  static get properties() {
    return { config: { type: Object } };
  }

  static get styles() {
    return css`
      .form-group {
        margin-bottom: 16px;
      }
      label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
      }
      input {
        width: 100%;
        box-sizing: border-box;
        padding: 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }
    `;
  }

  setConfig(config) {
    this.config = config;
  }

  render() {
    return html`
      <div class="form-group">
        <label>Entity</label>
        <input type="text" .value="${this.config?.entity || ""}" @input="${(e) => this._updateConfig("entity", e.target.value)}" placeholder="sensor.choremander_overview" />
      </div>
      <div class="form-group">
        <label>Title</label>
        <input type="text" .value="${this.config?.title || ""}" @input="${(e) => this._updateConfig("title", e.target.value)}" placeholder="Manage Children" />
      </div>
    `;
  }

  _updateConfig(key, value) {
    const config = { ...this.config, [key]: value };
    if (value === "") delete config[key];
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }
}

customElements.define("choremander-manage-children-card", ChoremanderManageChildrenCard);
customElements.define("choremander-manage-children-card-editor", ChoremanderManageChildrenCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "choremander-manage-children-card",
  name: "Choremander Manage Children",
  description: "Add, edit, and remove children from a card",
  preview: true,
});
