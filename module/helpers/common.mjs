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
        rollMode: game.settings.get("core", "rollMode"),
        sound: CONFIG.sounds.dice,
        flags: {
            trait: rollData.trait,
            value: rollData.value,
            actor: rollData.actor,
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
 * Change the count of checkboxes life
 * @param {object} html
 * @param {object} context
 * @private
 */
export function changeLifeCount(html,context){
    let newMax = 3 + context.system.traits.choushi.value;
    let array = html.find(".health > .flexrow > .resource-counter > .resource-value-step");
    if (context.system.traits.choushi.value<=0 && array.length > newMax ) {
        for (let i=0; i < array.length; i++ ){
            if (i> newMax){
                array[i].remove();
            }
        }
    }
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

    // 1. Détermine l'onglet actif (depuis tabGroups ou stock temporaire)
    const currentTab = _getCurrentTab(html, isItem) || this.tabGroups?.primary || 'core';

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

