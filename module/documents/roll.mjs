import { ChatManager } from './../chat/chat-manager.mjs';

export class yuigahamaRoll extends Roll {
    constructor(formula, data = {}, options = {}) {
        super(formula, data, options);

        this.data = this._prepareData(data);
        this.options = options;
        this.terms = this.constructor.parse(formula, this.data);
        this._formula = this.constructor.getFormula(this.terms);

        this.actor = data.actor;
        this.tokenUse = data.tokenUse;
        this.trait = data.trait;
        this.value = data.value;
        this.type = data.type;
        this.diceResult = {};
        this.info = "";
    }

    static CHAT_TEMPLATE = "systems/yuigahama/templates/roll/roll.html";
    static TOOLTIP_TEMPLATE = "systems/yuigahama/templates/roll/tooltip.html";

    /** @override */
    async render({template=this.constructor.CHAT_TEMPLATE, isPrivate=false}={}) {

        let success = false;
        let details = `${game.i18n.localize("yuigahama.dice.details")}`;

        this.terms[0].results.forEach((dice) => {

            let result = {
                value: parseInt(dice.result),
                valueName: this._transformValuetoName(parseInt(dice.result)),
            }

            this.diceResult.result = result;
            details += result.value.toString() ;
            if (result.value===1) {
                success = false;
                this.info = `${game.i18n.localize("yuigahama.dice.critical.failure")}`;
                details =`${game.i18n.localize("yuigahama.dice.critical.failure")}`;
            }
            else if (result.value===6) {
                success = true;
                this.info = `${game.i18n.localize("yuigahama.dice.critical.success")}`;
                details ="";
            }
            else {
                let total = result.value+ this.value + this.tokenUse;
                success = ( total>=4);

                details += (this.value<0)? this.value.toString() : "+"+this.value.toString();
                details += (this.tokenUse>0)? "+"+this.tokenUse.toString() : "";
                details +="="+total;
            }
            this.diceResult.success = success;
            this.diceResult.traitValue = this.value;
            this.diceResult.trait = this.trait;
            this.diceResult.tokenUse = this.tokenUse;
            this.diceResult.details = details;
            this.diceResult.type = this.type;
        });

        let title = this.diceResult.trait;
        if (this.tokenUse >0){
            title += (this.type === "roll")? `${game.i18n.localize("yuigahama.dice.force")}` : `${game.i18n.localize("yuigahama.dice.reroll")}`;
        }

        let canUseToken = (this.actor.system.token.value - this.diceResult.tokenUse) > 0;
        if (this.diceResult.result.value===6 && !canUseToken) this.info="";

        const templateData = {
            formula: isPrivate ? "???" : this._formula,
            actor: this.actor,
            diceResult : this.diceResult,
            title: title,
            info: this.info,
            canUseToken: canUseToken,
            tooltip: isPrivate ? "" : await this.getTooltip(),
        };

        return renderTemplate(template, templateData);
    }

    /** @override */
    async toMessage(messageData={}) {
        let message = await ChatMessage.create(messageData);

        await ChatManager.setMessageActor(message, this.actor, CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER);
    }

    /**
     * Transform int value into string for the class of font awesome dice
     * @param {int} value
     * @returns {string}
     */
    _transformValuetoName(value){
        let result = "";

        switch (value){
            case 1:
                result = "one";
                break;
            case 2:
                result = "two";
                break;
            case 3:
                result = "three";
                break;
            case 4:
                result = "four";
                break;
            case 5:
                result = "five";
                break;
            case 6:
                result = "six";
                break;
        }

        return result;
    }

    /**
     * Get explication dice in tooltip toggle
     * @returns {Promise<*>}
     */
    async getTooltip() {
        const tooltipData = {
            diceResult : this.diceResult,
            info: this.info,
        };

        return renderTemplate(this.constructor.TOOLTIP_TEMPLATE, tooltipData);
    }

    /**
     * For provide error from interpretation of Roll subclass in chatMessage
     * @override
     */
    toJSON() {
        const json = super.toJSON();
        json.class = yuigahamaRoll; //!IMPORTANT

        return json;
    }
}
