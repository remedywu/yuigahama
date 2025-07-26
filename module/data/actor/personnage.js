import {CommonActorData} from "./common.js";

const { SchemaField, NumberField, StringField } = foundry.data.fields;

export class PersonnageData extends CommonActorData {
    static defineSchema() {
        return {
            ...super.defineSchema(),
            token: new SchemaField({
                label: new StringField(),
                value: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
                use: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
            }),
        };
    }

}