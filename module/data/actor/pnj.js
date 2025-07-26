import {CommonActorData} from "./common.js";

const { SchemaField, NumberField, StringField } = foundry.data.fields;

export class PnjData extends CommonActorData {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            token: new SchemaField({
                value: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
            }),
        };
    }

}