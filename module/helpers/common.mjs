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
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
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
export function changeFont(sheet){
    let useHenshin = game.settings.get(CONFIG.yuigahama.moduleName, "useFontSpecial");
    sheet.element[0].style.fontFamily =(useHenshin)? "henshin" :"Roboto";
}

