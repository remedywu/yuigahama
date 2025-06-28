export const MESSAGE_OWNING_ACTOR = 'owning-actor';
export class ChatManager {

    static CRTICAL_SUCCESS_TEMPLATE = "systems/yuigahama/templates/roll/critical_success.html";
    /**
     * Init listeners on renderChatMessage
     * @returns {Promise<void>}
     */
    static async init() {
        Hooks.on("renderChatMessage", async (app, html, msg) => await ChatManager.onRenderChatMessage(app, html, msg));
    }

    /**
     * onRenderChatMessage display buttons
     * @param app
     * @param html
     * @param msg
     * @returns {Promise<void>}
     */
    static async onRenderChatMessage(app, html, msg) {
        const chatMessage = ChatManager.getChatMessageFromHtml(html);
        const showButtons = ChatManager.hasRight(chatMessage);

        const buttonReRoll = html.find('.ybs-button-reroll');
        const buttonSuccessCritical = html.find('.ybs-button-success-critical');
        if (showButtons) {
            buttonReRoll.show();
            buttonReRoll.click(async event => await ChatManager.onReRoll(ChatManager.getChatMessage(event)));

            buttonSuccessCritical.show();
            buttonSuccessCritical.click(async event => await ChatManager.onSuccessCritical(ChatManager.getChatMessage(event)));
        }
        else {
            buttonReRoll.hide();
            buttonReRoll.click(async event => { })

            buttonSuccessCritical.hide();
            buttonSuccessCritical.click(async event => { })
        }
    }

    /**
     * Get Messsage Chat with an html object
     * @param {object} html
     * @returns {*}
     */
    static getChatMessageFromHtml(html) {
        const chatMessageId = $(html).closest('.chat-message').attr('data-message-id');
        return game.messages.get(chatMessageId);
    }

    /**
     * Get Message chat with an event
     * @param {Event} event
     * @returns {*}
     */
    static getChatMessage(event) {
        const chatMessageId = $(event.currentTarget).closest('.chat-message').attr('data-message-id');
        const flavorText = $(event.currentTarget)
            .closest('.chat-message')
            .find('.dice-roll.yuigahama-roll .dice-flavor')
            .text()
            .trim();

        return {
            message: game.messages.get(chatMessageId),
            trait: flavorText,
            value : 1,
        };
    }

    /**
     * Check Right on a message for MESSAGE_OWNING_ACTOR
     * @param {object} chatMsg
     * @param {number} right
     * @returns {*|boolean}
     */
    static hasRight(chatMsg, right = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) {
        const owningActor = chatMsg.getFlag("yuigahama", MESSAGE_OWNING_ACTOR);
        if (owningActor) {
            const token = ChatManager.getToken(owningActor.tokenId)
            const actor = token?.actor ?? game.actors.get(owningActor.actorId)
            if (actor) {
                return actor.testUserPermission(game.user, Math.min(owningActor.right, right))
            }
            return true
        }
        return false
    }


    /**
     * Take the value of the Trait in the actor
     * @param {object} actor
     * @param {string} traitName
     * @returns {*|number}
     */
    static getTraitValue(actor, traitName) {
        return actor.system?.traits?.[traitName.toLowerCase()]?.value ?? 0;
    }

    /**
     * onReRoll display message
     * @param {object} chatMsg
     * @returns {Promise<void>}
     */
    static async onReRoll(chatMsg) {
        const value = this.getTraitValue(chatMsg.message.flags.actor, chatMsg.trait);

        //Infos for the dice
        const rollData = {
            actor: chatMsg.message.flags.actor,
            tokenUse : 0,
            trait: chatMsg.trait,
            value: value,
            type: "reroll",
        }

        const roll = new game.yuigahama.yuigahamaRoll("1d6", rollData);
        await roll.evaluate();
        let html = await roll.render();

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

        let actor = game.actors.get(chatMsg.message.flags.actor._id);
        await actor.updateTokenUse(1);

        //Fixe Temporaire
        if (chatMsg.message.flags.trait.length > 0) {
            await actor.updateEvolutionStats(chatMsg.message.flags.trait);
        }
    }

    /**
     * onSuccessCritical display message
     * @param {object} chatMsg
     * @returns {Promise<void>}
     */
    static async onSuccessCritical(chatMsg){
        let actor = game.actors.get(chatMsg.message.flags.actor._id);

        const templateData = {
            data: {
                actor: actor,
                message: `${game.i18n.localize("yuigahama.chat.message_success_critical")}`,
                description: "",
            }
        };

        const html = await foundry.applications.handlebars.renderTemplate(ChatManager.CRTICAL_SUCCESS_TEMPLATE, templateData);

        ChatMessage.create({
            type: CONST.CHAT_MESSAGE_STYLES.OOC,
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            content: html
        });

        await actor.updateTokenUse(1);
    }

    /**
     * @param {object} chatMsg
     * @param {yuigahamaActor} actor
     * @param {int} right
     * @param {object} data
     * @returns {Promise<void>}
     */
    static async setMessageActor(chatMsg, actor, right = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,data) {
        if (actor) {
            await chatMsg.setFlag("yuigahama", MESSAGE_OWNING_ACTOR, {
                actorId: actor.id,
                tokenId: actor.token?.id,
                right: right,
                trait: data?.flags?.trait,
                value: data?.flags?.value,
            });
        }
    }

    /**
     * Get token by id
     * @param {int} tokenId
     * @returns {*|undefined}
     */
    static getToken(tokenId) {
        return tokenId ? game.scenes.map(s => s.tokens.find(it => it.id === tokenId)).find(it => it !== undefined) : undefined;
    }
}
