export const MESSAGE_OWNING_ACTOR = 'owning-actor';
export class ChatManager {

    static CRTICAL_SUCCESS_TEMPLATE = "systems/yuigahama/templates/roll/critical_success.html";
    /**
     * Init listeners on renderChatMessage
     * @returns {Promise<void>}
     */
    static async init() {
        Hooks.on("renderChatMessageHTML", async (app, html, msg) => await ChatManager.onRenderChatMessage(app, html, msg));
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

        var $objet = $(html);

        const buttonReRoll = $objet.find('.ybs-button-reroll');
        const buttonSuccessCritical = $objet.find('.ybs-button-success-critical');
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
     * Read a system flag on a message, looking under the namespaced flags first
     * and falling back to the legacy root-level flag for messages created before the refactor.
     * @param {ChatMessage} message
     * @param {string} key
     * @returns {*}
     */
    static getMessageFlag(message, key) {
        return message?.flags?.yuigahama?.[key] ?? message?.flags?.[key];
    }

    /**
     * Resolve the live Actor document owning a chat message.
     * Uses the stored uuid, with a fallback to the legacy full-actor flag for old messages.
     * @param {ChatMessage} message
     * @returns {yuigahamaActor|null}
     */
    static getMessageActor(message) {
        const uuid = ChatManager.getMessageFlag(message, "actorUuid");
        if (uuid) {
            const doc = fromUuidSync(uuid);
            if (doc) return doc;
        }
        // Backward compatibility with messages created before the uuid refactor
        const legacy = message?.flags?.actor;
        if (legacy?._id) return game.actors.get(legacy._id);
        return null;
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
        const actor = ChatManager.getMessageActor(chatMsg.message);
        if (!actor) return;

        // Prefer the clean stored trait flag over the flavor text (which may carry a token suffix)
        const trait = ChatManager.getMessageFlag(chatMsg.message, "trait") || chatMsg.trait;
        const value = this.getTraitValue(actor, trait);

        //Infos for the dice
        const rollData = {
            actor: actor,
            tokenUse : 0,
            trait: trait,
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
            rollMode: game.settings.get("core", "messageMode"),
            sound: CONFIG.sounds.dice,
            flags: {
                yuigahama: {
                    trait: rollData.trait,
                    value: rollData.value,
                    actorUuid: actor.uuid,
                }
            }
        };

        await roll.toMessage(chatData);

        await actor.updateTokenUse(1);

        //Fixe Temporaire
        if (trait?.length > 0) {
            await actor.updateEvolutionStats(trait);
        }
    }

    /**
     * onSuccessCritical display message
     * @param {object} chatMsg
     * @returns {Promise<void>}
     */
    static async onSuccessCritical(chatMsg){
        const actor = ChatManager.getMessageActor(chatMsg.message);
        if (!actor) return;

        const templateData = {
            data: {
                actor: actor,
                message: `${game.i18n.localize("yuigahama.chat.message_success_critical")}`,
                description: "",
            }
        };

        const html = await foundry.applications.handlebars.renderTemplate(ChatManager.CRTICAL_SUCCESS_TEMPLATE, templateData);

        ChatMessage.create({
            style: CONST.CHAT_MESSAGE_STYLES.OOC,
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
                trait: data?.flags?.yuigahama?.trait,
                value: data?.flags?.yuigahama?.value,
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
