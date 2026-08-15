import { prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { prepareTabs, handleSquareChange } from "../helpers/common.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * Shared base for the character and NPC actor sheets.
 * Holds the tab handling, common context preparation and life-square handler.
 * @extends {foundry.applications.sheets.ActorSheetV2}
 */
export class YuigahamaActorSheetBase extends HandlebarsApplicationMixin(ActorSheetV2) {

  tabGroups = {
    primary: 'core'
  }

  /**
   * Build the tab definition (active state + css class) from the sheet's static TABS.
   * @returns {object}
   */
  getTabs() {
    return prepareTabs(this.constructor.TABS, this.tabGroups);
  }

  /**
   * V2: Replace getData. Prepares the context shared by every actor sheet,
   * then delegates sheet-specific enrichment to _prepareSheetData().
   * @param {object} options
   * @returns {Promise<object>}
   * @private
   */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.system = this.document.system;
    context.flags = this.document.flags;
    context.owner = this.actor.isOwner;
    context.editable = this.isEditable;
    context.tabs = this.getTabs();
    context.rollData = this.actor.getRollData();
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    await this._prepareSheetData(context, options);

    return context;
  }

  /**
   * Subclass hook to enrich the sheet context (items, derived data, …).
   * Default implementation does nothing.
   * @param {object} context
   * @param {object} options
   * @protected
   */
  async _prepareSheetData(context, options) {}

  async _preparePartContext(partId, context, options) {
    return super._preparePartContext(partId, context, options);
  }

  /**
   * Change the status of the life checkboxes.
   * @param {Event} event
   * @returns {Promise<void>}
   * @private
   */
  async _onSquareChange(event) {
    return handleSquareChange(this.actor, event);
  }
}
