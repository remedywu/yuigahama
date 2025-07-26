const { HTMLField, StringField  } = foundry.data.fields;

export class AttributeItemData extends foundry.abstract.TypeDataModel {

    static defineSchema() {
        return {
            description: new HTMLField({ initial: '' }),
            regles_opt: new HTMLField({ initial: '' }),
            subtitle: new StringField({ initial: '' }),
        };
    }

}
