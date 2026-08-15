/**
 * Generate the roll dice
 * @param {object} rollData
 * @returns {Promise<void>}
 */
export async function rollTheDice(rollData){

    const roll = new game.yuigahama.yuigahamaRoll("1d6", rollData);
    await roll.evaluate();
    let html = await roll.render();

    //Update the value of token before send the actor in chat data
    await rollData.actor.updateTokenUse(rollData.tokenUse);
    //Update Stats use of Traits
    await rollData.actor.updateEvolutionStats(rollData.trait);

    const chatData = {
        //type: CONST.CHAT_MESSAGE_STYLES.ROLL,
        rolls: [roll.toJSON()],
        content: html,
        speaker: ChatMessage.getSpeaker({ actor: rollData.actor }),
        rollMode: game.settings.get("core", "messageMode"),
        sound: CONFIG.sounds.dice,
        flags: {
            yuigahama: {
                trait: rollData.trait,
                value: rollData.value,
                actorUuid: rollData.actor.uuid,
            }
        }
    };

    await roll.toMessage(chatData);
}

/**
 * Get default Image
 * @param {string} type
 * @returns {string}
 */
export function getDefaultImg(type) {
    return "systems/yuigahama/assets/img/icons/"+type+".svg";
}

/**
 * Change font of the sheet
 * @param sheet
 */
export function changeFont(sheet) {
    const useHenshin = game.settings.get(CONFIG.yuigahama.moduleName, "useFontSpecial");
    const newFont = useHenshin ? "henshin" : "Roboto";
    const currentFont = sheet.element[0].style.fontFamily;

    // Si la font est déjà utilisée, ne rien faire
    if (currentFont === newFont) return;

    sheet.element[0].style.fontFamily = newFont;
}

/**
 * Compute the active state / css class of a sheet's tab definition.
 * Shared by every sheet's getTabs() to avoid duplication.
 * @param {object} tabsDef    The static TABS definition of the sheet
 * @param {object} tabGroups  The sheet's current tabGroups state
 * @returns {object}          The same tabsDef, mutated with active/cssClass
 */
export function prepareTabs(tabsDef, tabGroups) {
    for (const tab of Object.values(tabsDef)) {
        tab.active = tabGroups[tab.group] === tab.id;
        tab.cssClass = tab.active ? 'active' : '';
    }

    return tabsDef;
}

/**
 *
 * Manage and clean tabs
 * @param {object} html
 * @param {object} tabs
 * @param {boolean} isItem
 */
export function manageTabs(html, tabs,isItem){
    for (const tab of Object.values(tabs)) {
        const selector = `.item[data-tab="${tab.id}"][data-group="${tab.group}"]`;
        const el = html.find(selector);

        (tab.active)? el.addClass("active") : el.removeClass("active");
    }

    // 1. Détermine l'onglet actif (depuis le DOM, avec repli selon le type de feuille)
    const currentTab = _getCurrentTab(html, isItem) || (isItem ? 'description' : 'core');

    // 2. Nettoie tous les onglets
    html.find('.tab').removeClass('active');
    html.find('.sheet-tabs[data-group="primary"] a').removeClass('active');

    // 3. Active uniquement l'onglet actif
    html.find(`.tab[data-tab="${currentTab}"]`).addClass('active');
    html.find(`.sheet-tabs[data-group="primary"] a[data-tab="${currentTab}"]`).addClass('active');
}

/**
 * Get Current Tab for an item
 * @param {object} html
 * @param {boolean} isItem
 * @returns {*|string}
 * @private
 */
export function _getCurrentTab(html, isItem) {
    const el = html.find('.sheet-tabs[data-group="primary"] a.active');

    return (isItem)? (el.data('tab') || 'description') : (el.data('tab') || 'core') ;
}

/**
 * Manage square life event
 * @param actor
 * @param {Event} event
 * @returns {Promise<void>}
 */
export async function handleSquareChange(actor, event) {
    event.preventDefault();

    const element = event.currentTarget;
    const oldState = element.dataset.state || "";
    const dataset = element.dataset;

    // ArrayField : on met à jour le tableau complet (Foundry ne gère pas les updates par index)
    const values = foundry.utils.duplicate(actor.system.life.values);

    if (oldState === "") {
        values[dataset.index] = 1;
    } else if (oldState === "/") {
        values[dataset.index] = 2;
    } else {
        values[dataset.index] = 0;
    }

    await actor.update({ "system.life.values": values });
}

