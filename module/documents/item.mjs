import {getDefaultImg} from "../helpers/common.mjs";

export class yuigahamaItem extends Item {

  static async create(data, options = {}) {

    // Replace default image
    if (data.img === undefined) data.img = getDefaultImg(data.type);

    return super.create(data, options);
  }

  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
   getRollData() {
    // If present, return the actor's roll data.
    if ( !this.actor ) return null;
    const rollData = this.actor.getRollData();
    // Grab the item's system data as well.
    rollData.item = foundry.utils.deepClone(this.system);

    return rollData;
  }

  /**
   * Display this item in the chat log (used by hotbar item macros).
   * Attributs have no rollable formula, so we post their description.
   * @returns {Promise<ChatMessage>}
   */
  async roll() {
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const content = this.system?.description || this.system?.subtitle || "";

    return ChatMessage.create({
      speaker,
      flavor: this.name,
      content
    });
  }
}
