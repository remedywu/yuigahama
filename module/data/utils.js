const { NumberField, StringField } = foundry.data.fields;

/**
 * Make Traits with parameters
 * @param {string} name
 * @param {string} label
 * @returns {{name, label, value, min, max, use, evo}}
 */
export function makeTraitsFields(name, label) {
    return {
        name: new StringField({ initial: name, required: true, blank: false, nullable: false  }),
        label: new StringField({ initial: label, required: true, blank: false, nullable: false  }),
        value: new NumberField({ initial: 0, required: true, integer: true, min: -2, max: 2 }),
        min: new NumberField({ initial: -2, integer: true }),
        max: new NumberField({ initial: 2, integer: true }),
        use: new NumberField({ initial: 0, required: true, integer: true }),
        evo: new NumberField({ initial: 0, required: true, integer: true }),
    };
}
