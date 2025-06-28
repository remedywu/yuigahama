/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {
    return foundry.applications.handlebars.loadTemplates([
        // Actor partials.
        "systems/yuigahama/templates/actor/personnage/main.html",
        "systems/yuigahama/templates/actor/personnage/attributs.html",
        "systems/yuigahama/templates/actor/personnage/health.html",
        "systems/yuigahama/templates/actor/personnage/tokens.html",
        "systems/yuigahama/templates/actor/personnage/navigation.html",
        "systems/yuigahama/templates/actor/personnage/description.html",
        "systems/yuigahama/templates/actor/personnage/evolution.html",

        //PNJ
        "systems/yuigahama/templates/actor/pnj/main.html",
        "systems/yuigahama/templates/actor/pnj/navigation.html",
        "systems/yuigahama/templates/actor/pnj/description.html",
    ]);
};
