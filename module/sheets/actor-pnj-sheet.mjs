import {onManageActiveEffect} from "../helpers/effects.mjs";
import {rollTheDice} from "../helpers/common.mjs";
import {YuigahamaActorSheetBase} from "./actor-sheet-base.mjs";

/**
 * NPC sheet.
 * @extends {YuigahamaActorSheetBase}
 */
export class yuigahamaPNJSheet extends YuigahamaActorSheetBase {

    static DEFAULT_OPTIONS = {
        window: {
            icon: 'fa-solid fa-dice-d6',
            resizable: true
        },
        classes: ["yuigahama", "yuigahama-sheet"],
        position: {
            width: 1100,
            height: 750,
        },
        actions: {
            onRollDice: yuigahamaPNJSheet._onRoll,
        },
        form: {
            submitOnChange: true,
            closeOnSubmit: false,
        },
        dragDrop: [
            {
                dragSelector: '[data-drag]',
                dropSelector: null
            }
        ]
    }

    static PARTS = {
        header: {
            template: "systems/yuigahama/templates/actor/actor-pnj-sheet.html"
        }
    }

    static TABS = {
        core: {
            id: "core",
            group: "primary",
            icon: "systems/yuigahama/assets/img/icons/surfer.svg",
            title: "yuigahama.tab.first"
        },
        description: {
            id: "description",
            group: "primary",
            icon: "systems/yuigahama/assets/img/icons/equipement.svg",
            title: "yuigahama.tab.second"
        },
    }

    /**
     * V2: Replace activateListeners
     * @param context Same data return by _prepareContext(options)
     * @param options
     * @returns {Promise<void>}
     * @private
     */
    async _onRender(context, options) {
        //Reminder AppV2 has abandoned jQuery, so, if you still want to use it, you must add the following:
        const html = $(this.element)

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
    static async _onRoll(event) {
        event.preventDefault();
        const button = event.target.closest('.rollable');
        const dataset = button.dataset;

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
}
