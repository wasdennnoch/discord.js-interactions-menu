import { MessageActionRowComponentOptions, MessageComponentInteraction } from "discord.js";
import { Menu } from "./Menu";
import { MenuPage } from "./MenuPage";
import { MenuRow } from "./MenuRow";
import { clone, shallowEqual } from "./Utils";

interface BaseMenuComponentCallbackArgs<State, Options, InteractionType extends MessageComponentInteraction> {
    menu: Menu;
    page: MenuPage; // Can't easily define the type of the page state here sadly
    component: MenuComponent<State, Options, InteractionType>;
    interaction: InteractionType;
}

export interface BaseMenuComponentOptions<State, Options, InteractionType extends MessageComponentInteraction> {
    callback: (args: BaseMenuComponentCallbackArgs<State, Options, InteractionType>) => any | Promise<any>;
}

export abstract class MenuComponent<
    State = {},
    Options = {},
    InteractionType extends MessageComponentInteraction = MessageComponentInteraction> {

    public row!: MenuRow;
    public state: State = {} as State;
    private prevState: State = {} as State;

    public constructor(
        public readonly id: string,
        protected options: Options & BaseMenuComponentOptions<State, Options, InteractionType>
    ) { }

    public abstract serialize(): Promise<MessageActionRowComponentOptions>;

    public setOptions(options: Options): void {
        this.options = {
            ...this.options,
            ...options,
        };
        this.menu.markDirty();
    }

    public get page(): MenuPage {
        return this.row.page;
    }

    public get menu(): Menu {
        return this.row.page.menu;
    }

    public async init(): Promise<void> {
        // To be overridden
    }

    public _isDirty(): boolean {
        return !shallowEqual(this.state, this.prevState);
    }

    public async _init(row: MenuRow): Promise<void> {
        this.row = row;
        await this.init();
    }

    public async _onInteraction(interaction: MessageComponentInteraction): Promise<void> {
        if (interaction.customId !== this.id) {
            return;
        }
        this.prevState = clone(this.state);
        await this.options.callback({
            menu: this.menu,
            page: this.page,
            component: this,
            interaction: interaction as InteractionType,
        });
    }

}
