import {rollTheDice} from "../helpers/common.mjs";

export class DialogRoll extends FormApplication {
    constructor(actor, dataset) {
        super(dataset, {submitOnChange: true, closeOnSubmit: false});
        this.actor = actor;
        this.isFreeRole = actor === undefined;
        this.tokenUse = 0;
        this.value = parseInt(dataset.value);
        this.label = dataset.label;

        if (!this.isFreeRole) {
            this.options.title = `${this.actor.name}`;
        }
    }

    /**
     * Extend and override the default options used by the Actor Sheet
     * @returns {Object}
     */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["yuigahama yuigahama-dialog general-dialog"],
            template: "systems/yuigahama/templates/dialogs/dialog-roll.html",
            closeOnSubmit: false,
            submitOnChange: true,
            resizable: true,
            width:350,
            height:350,
        });
    }

    /**
     * Get Data and add others
     * @returns {Promise<*>}
     */
    async getData() {
        const data = super.getData();
        //Put actorData for simply access
        data.actorData = this.actor.system;
        let max = (this.actor.system.token.value < 3)? this.actor.system.token.value : 3
        data.tokenMax = max;
        data.tokenLoop = max +1;
        data.label = this.label;

        return data;
    }

    /** Override **/
    activateListeners(html) {
        super.activateListeners(html);

        html.find('.actionbutton').click(this._generalRoll.bind(this));
        html.find('.closebutton').click(this._closeForm.bind(this));
    }

    /** Override **/
    async _updateObject(event, formData) {
        this.tokenUse = formData['actorData.token.use'];
    }

    /**
     * Generate the formula for dice roll
     * @param {Event} event
     * @private
     */
    async _generalRoll(event) {
        if (this.object.close) {
            this.close();
            return;
        }

        //Infos for the dice
        const rollData = {
            actor: this.actor,
            tokenUse : this.tokenUse,
            trait: this.label,
            value: this.value,
            type: "roll",
        }

        await rollTheDice(rollData);

        this.close();
    }

    /**
     * Close the form
     * @param {Event} event
     * @private
     */
    _closeForm(event) {
        this.close();
    }

}
