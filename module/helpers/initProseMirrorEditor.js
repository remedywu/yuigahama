export default function initProseMirrorEditor() {

    Hooks.on("getProseMirrorMenuDropDowns", (menu, dropdowns) => {
        const wrapIn = foundry.prosemirror.commands.wrapIn;
        if (!("format" in dropdowns)) return;

        dropdowns.format.entries.push({
            action: "yuigahama",
            title: "Yuigahama Bad Seeds",
            children: [
                {
                    action: "te-sidenote-left",
                    title: "Sidenote (left)",
                    node: menu.schema.nodes.section,
                    attrs: { _preserve: { class: "sidenote left" } },
                    priority: 1,
                    cmd: () => menu._toggleBlock(menu.schema.nodes.section, wrapIn,
                        { attrs: { _preserve: { class: "sidenote left" } } })
                },
                {
                    action: "te-sidenote-right",
                    title: "Sidenote (right)",
                    node: menu.schema.nodes.section,
                    attrs: { _preserve: { class: "sidenote right" } },
                    priority: 1,
                    cmd: () => menu._toggleBlock(menu.schema.nodes.section, wrapIn,
                        { attrs: { _preserve: { class: "sidenote right" } } })
                },
            ],
        });
    });
}
