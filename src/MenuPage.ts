import { MessageComponentInteraction, MessageOptions } from "discord.js";
import Menu, { MessageActionRowType } from "./Menu";
import MenuRow from "./MenuRow";
import { clone, shallowEqual } from "./Utils";

interface MenuPageCallbackArgs<State> {
    menu: Menu;
    page: MenuPage<State>;
}

type MenuPageCallback<ReturnType, State> = (args: MenuPageCallbackArgs<State>) => ReturnType | Promise<ReturnType>;
type MessageOptionsWithoutComponents = Omit<MessageOptions, "components">;

export interface MenuPageOptions<State> {
    getInitialState?: MenuPageCallback<State, State>;
    getMessageOptions: MenuPageCallback<MessageOptionsWithoutComponents, State>;
}

export default class MenuPage<State = {}> {

    public menu!: Menu;
    public state: State = {} as State;
    private prevState: State = {} as State;
    private rows: MenuRow[] = [];

    public constructor(public readonly id: string, private readonly options: MenuPageOptions<State>) {}

    public addRow(...rows: MenuRow[]): void {
        this.rows.push(...rows);
    }

    public async _init(menu: Menu): Promise<void> {
        this.menu = menu;
        if (this.options.getInitialState) {
            this.state = await this.options.getInitialState({
                menu: this.menu,
                page: this,
            });
        }
        for (const row of this.rows) {
            await row._init(this as any as MenuPage);
        }
    }

    public async _getMessageOptions(): Promise<MessageOptionsWithoutComponents> {
        return this.options.getMessageOptions({
            menu: this.menu,
            page: this,
        });
    }

    public async _serialize(): Promise<MessageActionRowType[]> {
        return await Promise.all(this.rows.map(r => r._serialize()));
    }

    public _isDirty(): boolean {
        if (!shallowEqual(this.state, this.prevState)) {
            return true;
        }
        return this.rows.some(r => r._isDirty());
    }

    public async _onInteraction(interaction: MessageComponentInteraction): Promise<void> {
        this.prevState = clone(this.state);
        await Promise.all(this.rows.map(r => r._onInteraction(interaction)));
    }

}
