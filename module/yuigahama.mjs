// Import document classes.
import { yuigahamaActor } from "./documents/actor.mjs";
import { yuigahamaItem } from "./documents/item.mjs";
import { yuigahamaRoll } from "./documents/roll.mjs";
import { ChatManager } from './chat/chat-manager.mjs';
// Import sheet classes.
import { yuigahamaActorSheet } from "./sheets/actor-sheet.mjs";
import { yuigahamaPNJSheet } from "./sheets/actor-pnj-sheet.mjs";
import { yuigahamaItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { ybsConfig } from "./helpers/config.mjs";
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { RegisterSettings } from "./helpers/settings.mjs";
import {changeFont} from "./helpers/common.mjs";

//Init Hook
Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.yuigahama = {
    yuigahamaActor,
    yuigahamaItem,
    yuigahamaRoll,
  };

  //Init The chat manager for buttons
  await ChatManager.init();

  // Global access config
  CONFIG.yuigahama = ybsConfig;
  // Define custom Document classes
  CONFIG.Actor.documentClass = yuigahamaActor;
  CONFIG.Item.documentClass = yuigahamaItem;

  // Register sheet application classes
  foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
  foundry.documents.collections.Actors.registerSheet("personnage", yuigahamaActorSheet, {
    types: ["personnage"],
    makeDefault: true
  });

  foundry.documents.collections.Actors.registerSheet("pnj", yuigahamaPNJSheet, {
    types: ["pnj"],
    makeDefault: true
  });
  foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
  foundry.documents.collections.Items.registerSheet("yuigahama", yuigahamaItemSheet, { makeDefault: true });

  // Register custom system settings
  RegisterSettings();

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */
Handlebars.registerHelper('concat', function() {
  var outStr = '';
  for (var arg in arguments) {
    if (typeof arguments[arg] != 'object') {
      outStr += arguments[arg];
    }
  }
  return outStr;
});

Handlebars.registerHelper('toLowerCase', function(str) {
  return str.toLowerCase();
});

Handlebars.registerHelper("numLoop", function (num,max, options) {
  let ret = "";
  for (let i = 0, j = num; i < j; i++) {
    let object ={
      index: i,
      max: max
    }

    ret = ret + options.fn(object);
  }

  return ret;
});

Handlebars.registerHelper("damageState", function (healthValues, index) {
  let result = "";
  if (index < healthValues.length){
    if (parseInt(healthValues[index])===1) result = "/";
    else if (parseInt(healthValues[index])===2) result = "X";
  }

  return result;
});

// Ready Hook
Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));

  let useHenshin = game.settings.get(CONFIG.yuigahama.moduleName, "useFontSpecial");
  let styleFont = (useHenshin)? 'font-family:henshin' : 'font-family:Roboto'
  document.body.setAttribute('style', styleFont);
});

// Render ActorSheet Hook
Hooks.on("renderActorSheet", (sheet) => {
  changeFont(sheet);
});

Hooks.on("renderItemSheet", (sheet) => {
  changeFont(sheet);
});

Hooks.on("renderApplication", (sheet) => {
  changeFont(sheet);
});

Hooks.on("renderCompendium", (sheet) => {
  changeFont(sheet);
});


/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */
/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== "Item") return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn("You can only create macro buttons for owned Items");
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.yuigahama.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "yuigahama.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then(item => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(`Could not find item ${itemName}. You may need to delete and recreate this macro.`);
    }

    // Trigger the item roll
    item.roll();
  });
}
