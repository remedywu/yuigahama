import { getDefaultImg } from "../helpers/common.mjs";

export class yuigahamaActor extends Actor {

  /** @override */
  static async create(data, options={}) {
    if (data.img === undefined) data.img = getDefaultImg(data.type);

    return super.create(data, options);
  }

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.
    this._getCharacterRollData(data);

    return data;
  }

  /**
   * Prepare Personnage roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'personnage') return;

    // Copy the traits scores to the top level, so that rolls can use
    if (data.traits) {
      for (let [k, v] of Object.entries(data.traits)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }
  }

  /**
   * Update the number of token use for the actor
   * @param {int} countTokens
   * @returns {Promise<void>}
   */
  async updateTokenUse(countTokens){
    if (countTokens <=0) return ;
    const newValue = Math.max(0, this.system.token.value - countTokens);

    await this.update({ "system.token.value": newValue });
  }

  /**
   * Update stats of use Traits
   * @param traitLabel
   * @returns {Promise<void>}
   */
  async updateEvolutionStats(traitLabel){
    const key = traitLabel.toLowerCase();
    const trait = this.system.traits?.[key];
    if (!trait) return;

    await this.update({ [`system.traits.${key}.use`]: trait.use + 1 });
  }

}
