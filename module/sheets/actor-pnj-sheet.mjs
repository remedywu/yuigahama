import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";
import {rollTheDice, changeLifeCount} from "../helpers/common.mjs";

export class yuigahamaPNJSheet extends foundry.appv1.sheets.ActorSheet {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["yuigahama yuigahama-sheet"],
            width: 1100,
            height: 750,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "core" }]
        });
    }

    /** @override */
    get template() {
        return `systems/yuigahama/templates/actor/actor-pnj-sheet.html`;
    }

    /** @override */
    getData() {
        const context = super.getData();

        // Use a safe clone of the actor data for further operations.
        const actorData = this.actor.toObject(false);

        // Add the actor's data to context.data for easier access, as well as flags.
        context.system = actorData.system;
        context.flags = actorData.flags;

        // Add roll data for TinyMCE editors.
        context.rollData = context.actor.getRollData();

        // Prepare active effects
        context.effects = prepareActiveEffectCategories(this.actor.effects);

        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Render the item sheet for viewing/editing prior to the editable check.
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            item.sheet.render(true);
        });

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Active Effect management
        html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

        // Rollable Traits.
        html.find('.rollable').click(this._onRoll.bind(this));
        changeLifeCount(html,this.actor);

        //Life Points
        html.find(".health > .flexrow > .resource-counter > .resource-value-step").click(this._onSquareChange.bind(this));

        // Drag events for macros.
        if (this.actor.isOwner) {
            let handler = ev => this._onDragStart(ev);
            html.find('li.item').each((i, li) => {
                if (li.classList.contains("inventory-header")) return;
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", handler, false);
            });
        }
    }

    /**
     * Handle clickable rolls.
     * @param {Event} event The originating click event
     * @private
     */
    async _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        //Dialog before launch the dice
        if (dataset.value){
            //Infos for the dice
            const rollData = {
                actor: this.actor,
                tokenUse : 0,
                trait: dataset.label,
                value: parseInt(dataset.value),
                type: "roll",
            }
            await rollTheDice(rollData);
        }
    }

    /**
     * Change the status of the life checkboxes
     * @param {Event} event
     * @returns {Promise<void>}
     * @private
     */
    async _onSquareChange(event) {
        event.preventDefault();

        const element = event.currentTarget;
        const oldState = element.dataset.state || "";
        const dataset = element.dataset;

        const actorData = foundry.utils.duplicate(this.actor);

        if (oldState === "") {
            actorData.system.life.values[dataset.index] = 1;
        }
        else if (oldState === "/") {
            actorData.system.life.values[dataset.index] = 2;
        }
        else actorData.system.life.values[dataset.index] = 0;

        await this.actor.update(actorData);
    }
}
