import { makeTraitsFields } from '../utils.js';
const { SchemaField, NumberField, StringField, ArrayField, HTMLField } = foundry.data.fields;

/**
 * Classe pour les données communes entre personnage et pnj
 */
export class CommonActorData extends foundry.abstract.TypeDataModel {
    /**
     * Schéma des données du modèle
     * @returns {{traits, life, description}}
     */
    static defineSchema() {
        return {
            traits: new SchemaField({
                choushi: new SchemaField(makeTraitsFields("CHOUSHI", "Forme")),
                kiyousa: new SchemaField(makeTraitsFields("KIYOUSA", "Dextérité")),
                chisei: new SchemaField(makeTraitsFields("CHISEI", "Intelligence")),
                yuuben: new SchemaField(makeTraitsFields("YUUBEN", "Éloquence")),
                chikaku: new SchemaField(makeTraitsFields("CHIKAKU", "Perception")),
                nintai: new SchemaField(makeTraitsFields("NINTAI", "Détermination")),
            }),
            life: new SchemaField({
                list: new ArrayField(
                    new SchemaField({
                        label: new StringField({ initial: "uchimi" }),
                        status: new StringField({ initial: "/" }),
                    })
                ),
                values: new ArrayField(
                    new NumberField({ integer: true, initial: 0 })
                ),
                max: new NumberField({ initial: 5, integer: true }),
            }),
            description : new HTMLField({ initial: '' }),
        };
    }

    /**
     * Migration des données (lors des changements de version)
     */
    static migrateData(data) {
        return super.migrateData(data);
    }

    /**
     * Données de base calculées à chaque chargement
     */
    prepareBaseData() {
        super.prepareBaseData();
    }

    /**
     * Données dérivées calculées à partir des données de base.
     * Le maximum de points de vie dépend de la Forme (choushi) : 3 + choushi, borné à 1 minimum.
     */
    prepareDerivedData() {
        super.prepareDerivedData();

        const choushi = this.traits?.choushi?.value ?? 0;
        this.life.max = Math.max(1, 3 + choushi);

        // Garantit que le tableau des états couvre tous les carrés affichés (évite les trous)
        const values = this.life.values ?? [];
        for (let i = 0; i < this.life.max; i++) {
            if (typeof values[i] !== "number") values[i] = 0;
        }
        this.life.values = values;
    }
}
