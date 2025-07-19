import {manageTabs} from "../helpers/common.mjs";

const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

export class yuigahamaItemSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheetV2) {

  static PARTS = {
    header: {
      template: `systems/yuigahama/templates/item/item-attribut-sheet.html`
    },
  };

  static DEFAULT_OPTIONS = {
    classes: ["yuigahama", "sheet", "item"],
    window: {
      contentClasses: ['standard-form', 'scrollable'],
      resizable: true,
    },
    actions: {},
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      width: 550,
      height: 600,
    },
    dragDrop: [{ dragSelector: "[data-drag]", dropSelector: null }],
  };

  static TABS = {
    description : {
          id: 'description',
          group: 'primary',
          title: 'yuigahama.tab.first',
          icon: '<i class="fa-regular fa-chart-line"></i>'
        },
    attributes: {
          id: 'attributes',
          group: 'primary',
          title: 'yuigahama.tab.second',
          icon: '<i class="fa-solid fa-file-contract"></i>'
        }
  }

  tabGroups = {
    primary: 'description'
  }

  getTabs () {
    const tabs = yuigahamaItemSheet.TABS

    for (const tab of Object.values(tabs)) {
      tab.active = this.tabGroups[tab.group] === tab.id
      tab.cssClass = tab.active ? 'active' : ''
    }

    return tabs
  }

  get title() {
    return `${this.item.name}`;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.item = context.document;
    // Prepare tabs
    context.tabs = this.getTabs()

    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    //Reminder AppV2 has abandoned jQuery, so, if you still want to use it, you must add the following:
    const html = $(this.element)

    //Tab active for CSS
    const tabs = this.getTabs();

    manageTabs(html,tabs,true);
  }

  async _preparePartContext(partId, context, options) {
    const partContext = await super._preparePartContext(partId, context, options);

    if (partId === this.item.type)
      partContext.tab = partContext.tabs.description;   // so template can access tab.cssClass
    else
      partContext.tab = partContext.tabs[partId];   // so template can access tab.cssClass
    return partContext;
  }

}
