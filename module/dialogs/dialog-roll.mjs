import {rollTheDice} from "../helpers/common.mjs";
// V2 (New)
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class DialogRoll extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor, dataset) {
        super(dataset, {submitOnChange: true, closeOnSubmit: false});
        this.actor = actor;
        this.value = parseInt(dataset.value);
        this.label = dataset.label;
    }

    // V2 Pattern (New)
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        tag: 'form',  // REQUIRED for dialogs and forms
        form: {
            submitOnChange: false,
            closeOnSubmit: true,
            handler: DialogRoll.onSubmit,
        },
        classes: ["yuigahama yuigahama-dialog general-dialog"],
        position: {
            width: 350,
            height: 350
        },
        window: {
            resizable: true,
            title: '',
        },
    }

    static PARTS = {
        form: {
            template: 'systems/yuigahama/templates/dialogs/dialog-roll.html'
        }
    }

    /**
     * V2: Get Data and add others
     * @returns {Promise<*>}
     */
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        //Put actorData for simply access
        context.actorData = this.actor.system;
        let max = (this.actor.system.token.value < 3)? this.actor.system.token.value : 3
        context.tokenMax = max;
        context.tokenLoop = max +1;
        context.label = this.label;

        return context;
    }

    /**
     * V2: Replace activateListeners
     * @param context Same data return by _prepareContext(options)
     * @param options
     * @returns {Promise<void>}
     * @private
     */
    async _onRender(context,options) {
        await super._onRender(context, options);
    }

    async _onSubmitForm(event, formData) {
        return super._onSubmitForm(event, formData);
    }

    /**
     *
     * @param {Event} event The event object.
     * @param {object} form The form object.
     * @param {object} formData The form data compiled by foundry.
     */
    static async onSubmit(event, form, formData) {
        const data = foundry.utils.expandObject(formData.object);

        //Infos for the dice
        const rollData = {
            actor: this.actor,
            tokenUse : data.actorData.token.use,
            trait: this.label,
            value: this.value,
            type: "roll",
        }

        await rollTheDice(rollData);
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
