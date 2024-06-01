import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";
import {DialogRoll} from "../dialogs/dialog-roll.mjs";
import {rollTheDice, changeLifeCount, getDefaultImg} from "../helpers/common.mjs";

export class yuigahamaActorSheet extends ActorSheet {

  static SEVEN_LUCKY_TEMPLATE = "systems/yuigahama/templates/roll/sevenlucky.html";

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["yuigahama yuigahama-sheet"],
      width: 850,
      height: 770,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "core" }]
    });
  }

  /** @override */
  get template() {
    return `systems/yuigahama/templates/actor/actor-${this.actor.type}-sheet.html`;
  }

  /** @override */
  getData() {
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Prepare character data and items.
    this._prepareItems(context);
    this._prepareCharacterData(context);

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   * @param {Object} context The actor to prepare.
   * @return {undefined}
   */
  _prepareCharacterData(context) {

  }

  /**
   * Organize and classify Items for Character sheets.
   * @param {Object} context The actor to prepare.
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const attributs = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      if (i.type === 'attribut') {
        attributs.push(i);
      }
    }

    // Assign and return
    context.attributs = attributs;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable Traits.
    html.find('.rollable').click(this._onRoll.bind(this));
    changeLifeCount(html,this.actor);

    //Life Points
    html.find(".health > .flexrow > .resource-counter > .resource-value-step").click(this._onSquareChange.bind(this));

    //Evolution
    this._initEvolution(this.actor);
    html.find(".button_ic-left").click(this._onChangeEvo.bind(this));
    html.find(".button_ic-right").click(this._onChangeEvo.bind(this));
    html.find(".ybs-button-evo-reinit").click(this._onReinit.bind(this));

    //Lucky Seven >=7 Jetons Unmei
    html.find(".ybs-button-luckyseven").click(this._onLuckySeven.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = foundry.utils.duplicate(header.dataset);
    const name = `New ${type.capitalize()}`;
    const itemData = {
      name: name,
      type: type,
      system: data,
      img :  getDefaultImg(type)
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];

    return await Item.create(itemData, {parent: this.actor});
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event The originating click event
   * @private
   */
  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    //Dialog before launch the dice
    if (dataset.value){
     //If tokens display dialog
      if (this.actor.system.token.value >0){
        const myDialog = new DialogRoll(this.actor,dataset);
        myDialog.render(true);
      }
      else {
        //Infos for the dice
        const rollData = {
          actor: this.actor,
          tokenUse : 0,
          trait: dataset.label,
          value: parseInt(dataset.value),
          type: "roll",
        }
        await rollTheDice(rollData);
      }
    }
  }

  /**
   * Change the status of the life checkboxes
   * @param {Event} event
   * @returns {Promise<void>}
   * @private
   */
  async _onSquareChange(event) {
    event.preventDefault();

    const element = event.currentTarget;
    const oldState = element.dataset.state || "";
    const dataset = element.dataset;

    const actorData = foundry.utils.duplicate(this.actor);

    if (oldState === "") {
      actorData.system.life.values[dataset.index] = 1;
    }
    else if (oldState === "/") {
      actorData.system.life.values[dataset.index] = 2;
    }
    else actorData.system.life.values[dataset.index] = 0;

    await this.actor.update(actorData);
  }

  /**
   * Init The percentage of visibility of the image in the evolution tab
   * @param {object} context
   * @private
   */
  _initEvolution(context){
    for (let [key] of Object.entries(context.system.traits)) {
      document.getElementById('myImage'+key).style.clipPath = "inset(0% " + (100 - this.actor.system.traits[key].evo) + "% 0% 0%)";
    }
  }

  /**
   * Change Evolution visibility of the trait image with button Plus and Minus
   * @param {Event} event
   * @returns {Promise<void>}
   * @private
   */
  async _onChangeEvo(event){
    event.preventDefault();

    let trait = $(event.currentTarget).attr('data-trait');
    let evolution = ($(event.currentTarget).attr('data-operation')==="plus")? 20 : -20;

    const actorData = foundry.utils.duplicate(this.actor);
    let visibilityPercentage = actorData.system.traits[trait.toLowerCase()].evo;
    visibilityPercentage = visibilityPercentage+evolution;
    if (visibilityPercentage >100 || visibilityPercentage <0) return;

    // The percentage stay between 0 and 100
    visibilityPercentage = Math.min(100, Math.max(0, visibilityPercentage));
    // Calcul clip-path in function of the percentage
    document.getElementById('myImage'+trait).style.clipPath = "inset(0% " + (100 - visibilityPercentage) + "% 0% 0%)";

    //Update value Evolution
    actorData.system.traits[trait.toLowerCase()].evo = visibilityPercentage;
    await this.actor.update(actorData);
  }

  /**
   * RAZ parameters for evolution use
   * @param {Event} event
   * @returns {Promise<void>}
   * @private
   */
  async _onReinit(event){
    event.preventDefault();

    const actorData = foundry.utils.duplicate(this.actor);
    for (let [key] of Object.entries(actorData.system.traits)) {
      actorData.system.traits[key].use = 0;
    }

    await this.actor.update(actorData);
  }

  /**
   * Use 7 tokens for the Lucky Seven
   * @param {Event} event
   * @returns {Promise<void>}
   * @private
   */
  async _onLuckySeven(event){
    event.preventDefault();

    const templateData = {
      data: {
        actor: this.actor,
        message: `${game.i18n.localize("yuigahama.chat.message_luckyseven")}`,
        description: "",
      }
    };

    const html = await renderTemplate(yuigahamaActorSheet.SEVEN_LUCKY_TEMPLATE, templateData);

    ChatMessage.create({
      type: CONST.CHAT_MESSAGE_STYLES.OOC,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      sound: CONFIG.sounds.notification,
      content: html
    });

    await this.actor.updateTokenUse(7);
  }

}
