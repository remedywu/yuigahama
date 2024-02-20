/**
 * Custom system settings register
 */
export const RegisterSettings = function () {
    /* ------------------------------------ */
    /* User settings                        */
    /* ------------------------------------ */
    game.settings.register(CONFIG.yuigahama.moduleName, "useFontSpecial", {
        name: "SETTINGS.useFontSpecial.text",
        hint: "SETTINGS.useFontSpecial.hint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
        onChange: () => location.reload()
    });

};
