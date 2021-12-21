import { MessageComponentInteraction } from "discord.js";
import { MessageActionRowType } from "./Menu";
import { MenuComponent } from "./MenuComponent";
import { MenuPage } from "./MenuPage";

export class MenuRow {

    public page!: MenuPage<any>;
    private components: MenuComponent[] = [];

    public addComponent(...components: MenuComponent<any, any>[]) {
        this.components.push(...components);
    }

    public async _init(page: MenuPage): Promise<void> {
        this.page = page;
        for (const component of this.components) {
            await component._init(this);
        }
    }

    public async _serialize(): Promise<MessageActionRowType> {
        return {
            type: "ACTION_ROW",
            components: await Promise.all(this.components.map(c => c.serialize())),
        };
    }

    public _isDirty(): boolean {
        return this.components.some(c => c._isDirty());
    }

    public async _onInteraction(interaction: MessageComponentInteraction): Promise<void> {
        await Promise.all(this.components.map(c => c._onInteraction(interaction)));
    }

}
