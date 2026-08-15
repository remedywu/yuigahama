import {onManageActiveEffect} from "../helpers/effects.mjs";
import {DialogRoll} from "../dialogs/dialog-roll.mjs";
import {rollTheDice, manageTabs} from "../helpers/common.mjs";
import {yuigahamaItem} from "../documents/item.mjs";
import {YuigahamaActorSheetBase} from "./actor-sheet-base.mjs";

/**
 * Character sheet.
 * @extends {YuigahamaActorSheetBase}
 */
export class yuigahamaActorSheet extends YuigahamaActorSheetBase {

  static SEVEN_LUCKY_TEMPLATE = "systems/yuigahama/templates/roll/sevenlucky.html";
  dragDrop;

  constructor(...args) {
    super(...args);
    this.dragDrop = this.createDragDropHandlers();
  }

  // V2 Pattern (New) Replace static get defaultOptions()
  static DEFAULT_OPTIONS = {
    window: {
      icon: 'fa-solid fa-dice-d6',
      resizable: true
    },
    classes: ["yuigahama", "yuigahama-sheet"],
    position: {
      width: 850,
      height: 770,
    },
    actions: {
      onItemCreate: yuigahamaActorSheet._onItemCreate,
      onItemEdit: yuigahamaActorSheet._onItemEdit,
      onItemDelete: yuigahamaActorSheet._onItemDelete,
      onRollDice: yuigahamaActorSheet._onRoll,
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    dragDrop: [
      {
        dragSelector: '[data-drag]',
        dropSelector: null
      }
    ]
  }

  static PARTS = {
    header: {
      template: "systems/yuigahama/templates/actor/actor-personnage-sheet.html"
    }
  }

   static TABS = {
    core: {
      id: "core",
      group: "primary",
      icon: "systems/yuigahama/assets/img/icons/surfer.svg",
      title: "yuigahama.tab.first"
    },
    description: {
      id: "description",
      group: "primary",
      icon: "systems/yuigahama/assets/img/icons/equipement.svg",
      title: "yuigahama.tab.second"
    },
    evolution: {
      id: "evolution",
      group: "primary",
      icon: "systems/yuigahama/assets/img/icons/mystere.svg",
      title: "yuigahama.tab.third"
    }
  }

  get title() {
    return this.actor.isToken ? `[Token] ${this.actor.name}` : this.actor.name
  }

  /**
   * Character-specific context enrichment (items + derived character data).
   * @param {object} context
   * @protected
   */
  async _prepareSheetData(context) {
    this._prepareItems(context);
    this._prepareCharacterData(context);
  }

  /**
   * V2: Replace activateListeners
   * @param {object} context Same data return by _prepareContext(options)
   * @param {object} options
   * @returns {Promise<void>}
   * @private
   */
  async _onRender(context, options) {
    //Reminder AppV2 has abandoned jQuery, so, if you still want to use it, you must add the following:
    const html = $(this.element)

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    //Life Points
    html.find(".health > .flexrow > .resource-counter > .resource-value-step").click(this._onSquareChange.bind(this));

    //Evolution
    this._initEvolution(this.actor);
    html.find(".button_ic-left").click(this._onChangeEvo.bind(this));
    html.find(".button_ic-right").click(this._onChangeEvo.bind(this));
    html.find(".ybs-button-evo-reinit").click(this._onReinit.bind(this));

    //Lucky Seven >=7 Jetons Unmei
    html.find(".ybs-button-luckyseven").click(this._onLuckySeven.bind(this));

    //Tab active for CSS
    const tabs = this.getTabs();

    manageTabs(html,tabs,false);

    new foundry.applications.ux.DragDrop.implementation({
      dragSelector: '[data-drag], .item-list .item',
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        drop: this._onDrop.bind(this),
      }
    }).bind(this.element);

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
    const attributs = [];

    // Iterate through items, allocating to containers
    if (context.source.items !==undefined){
      for (let i of context.source.items) {
        i.img = i.img || CONST.DEFAULT_TOKEN;
        if (i.type === 'attribut') {
          attributs.push(i);
        }
      }
    }

    // Assign and return
    context.attributs = attributs;
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @param {object} target
   * @private
   */
  static async _onItemCreate(event, target) {
    const header = target;
    const docCls = getDocumentClass(header.dataset.documentClass || "Item");
    const type = target.dataset.type || "item";

    const itemData = {
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type: type,
      parent: this.actor
    };

    for (const [dataKey, value] of Object.entries(header.dataset)) {
      if (["action", "documentClass"].includes(dataKey)) continue;
      foundry.utils.setProperty(itemData, dataKey, value);
    }
    await docCls.create(itemData, {
      parent: this.actor
    });
  }

  /**
   *  Edit an attribut (item)
   * @param {Event} event
   * @returns {Promise<void>}
   * @private
   */
  static async _onItemEdit(event) {
    const entry = event.target.closest('.item');
    const itemId = entry.dataset.itemId;
    const item = this.actor.items.get(itemId);
    item.sheet.render(true);
  }

  /**
   * Delete an attribute (item) with dialog
   * @param {Event} event
   * @returns {Promise<void>}
   * @private
   */
  static async _onItemDelete(event) {
    const entry = event.target.closest('.item');
    const itemId = entry.dataset.itemId;
    await new foundry.applications.api.DialogV2({
      window: {
        title: game.i18n.localize('yuigahama.dialog.deleteitem')
      },
      content: `<p>${game.i18n.localize('yuigahama.dialog.deleteconfirm')}</p>`,
      position: {
        height: "auto",
        width: 350
      },
      buttons: [{
        action: "yes",
        default: false,
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize('yuigahama.dialog.yes'),
        callback: async () => {
          await this.actor.deleteEmbeddedDocuments('Item', [itemId]);
        },
      },
        {
          action: "no",
          default: true,
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('yuigahama.dialog.no'),
          callback: (event, button, htmlElement) => {
            return null;
          },
        },],
      close: () => null,
    }).render(true);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event The originating click event
   * @private
   */
  static async _onRoll(event) {
    event.preventDefault();

    const button = event.target.closest('.rollable');
    const dataset = button.dataset;

    if (dataset.value) {
      if (this.actor.system.token.value > 0) {
        const myDialog = new DialogRoll(this.actor, dataset);
        myDialog.render(true);
      } else {
        const rollData = {
          actor: this.actor,
          tokenUse: 0,
          trait: dataset.label,
          value: parseInt(dataset.value),
          type: "roll",
        };
        await rollTheDice(rollData);
      }
    }
  }

  /**
   * Init The percentage of visibility of the image in the evolution tab
   * @param {object} context
   * @private
   */
  _initEvolution(context){
    for (let [key] of Object.entries(context.system.traits)) {
      const traitData = context.system.traits[key];
      const imageElem = document.getElementById('myImage' + key);
      if (!imageElem) continue;
      if (typeof traitData?.evo !== "number") continue;
      imageElem.style.clipPath = "inset(0% " + (100 - traitData.evo) + "% 0% 0%)";
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
    let evolution = ($(event.currentTarget).attr('data-operation') === "plus") ? 20 : -20;

    const key = trait.toLowerCase();
    let visibilityPercentage = this.actor.system.traits[key].evo + evolution;
    if (visibilityPercentage > 100 || visibilityPercentage < 0) return;

    // The percentage stay between 0 and 100
    visibilityPercentage = Math.min(100, Math.max(0, visibilityPercentage));

    const imageElem = document.getElementById('myImage' + trait);
    if (imageElem) {
      imageElem.style.clipPath = "inset(0% " + (100 - visibilityPercentage) + "% 0% 0%)";
    }

    await this.actor.update({ [`system.traits.${key}.evo`]: visibilityPercentage }, { render: false });
  }

  /**
   * RAZ parameters for evolution use
   * @param {Event} event
   * @returns {Promise<void>}
   * @private
   */
  async _onReinit(event){
    event.preventDefault();

    const update = {};
    for (const key of Object.keys(this.actor.system.traits)) {
      update[`system.traits.${key}.use`] = 0;
    }

    // Mise à jour sans re-render
    await this.actor.update(update, { render: false });

    // MAJ manuelle des inputs dans l'UI
    const html = this.element; // Pas besoin de re-wrap avec $
    for (const key of Object.keys(this.actor.system.traits)) {
      const selector = `input[name="system.traits.${key}.use"]`;
      const input = html.querySelector(selector);
      if (input) input.value = 0;
    }
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

    const html = await foundry.applications.handlebars.renderTemplate(yuigahamaActorSheet.SEVEN_LUCKY_TEMPLATE, templateData);

    ChatMessage.create({
      style: CONST.CHAT_MESSAGE_STYLES.OOC,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      sound: CONFIG.sounds.notification,
      content: html
    });

    await this.actor.updateTokenUse(7);
  }

  //Drag and Drop
  createDragDropHandlers() {
    return this.options.dragDrop.map(d => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      };
      return new foundry.applications.ux.DragDrop(d);
    });
  }

  _canDragStart(selector) {
    return this.isEditable;
  }

  _canDragDrop(selector) {
    return this.isEditable;
  }

  _onDragStart(event) {
    const docRow = event.currentTarget.closest('li');
    if ('link' in event.target.dataset) return;
    let dragData = this._getEmbeddedDocument(docRow)?.toDragData();
    if (!dragData) return;
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }

  _onDragOver(event) {

  }

  /**
   * Drop an item into the sheet
   * @param {Event} event
   * @returns {Promise<void>}
   * @private
   */
  async _onDrop(event) {
    const header = event.currentTarget;
    const docCls = getDocumentClass(header.dataset.documentClass || "Item");
    // Note, Item#_onDrop does not exist
    const data = foundry.applications.ux.TextEditor.getDragEventData(event);
    const droppedDocument = await fromUuid(data.uuid);

    if (droppedDocument instanceof yuigahamaItem){
      const itemData = {
        name: droppedDocument.name,
        type: droppedDocument.type,
        img: droppedDocument.img,
        system:droppedDocument.system,
        parent: this.actor
      };

      for (const [dataKey, value] of Object.entries(header.dataset)) {
        if (["action", "documentClass"].includes(dataKey)) continue;
        foundry.utils.setProperty(itemData, dataKey, value);
      }
      await docCls.create(itemData, {
        parent: this.actor
      });
    }

  }

}
