import {
    BaseCommandInteraction, BaseMessageComponentOptions, Message, MessageActionRowOptions,
    MessageComponentInteraction, MessageOptions, TextBasedChannels, InteractionCollector, Interaction,
} from "discord.js";
import MenuPage from "./MenuPage";

export type MessageActionRowType = Required<BaseMessageComponentOptions> & MessageActionRowOptions;
export type MenuSource = TextBasedChannels | Message | BaseCommandInteraction | MessageComponentInteraction;

export default class Menu {

    public message: Message | null = null;
    private currentPageId: string | null = null;
    private dirty: boolean = false;
    private pages: Map<string, MenuPage<any>> = new Map();
    private lastInteraction: MessageComponentInteraction | undefined;
    private collector!: InteractionCollector<MessageComponentInteraction>;

    public constructor(private readonly source: MenuSource) {}

    public addPage(...pages: MenuPage<any>[]): void {
        for (const page of pages) {
            this.pages.set(page.id, page);
        }
    }

    public setPage(pageId: string): void {
        if (!this.pages.has(pageId)) {
            throw new Error(`Unknown page ID '${pageId}'`);
        }
        this.currentPageId = pageId;
        this.dirty = true;
    }

    public async init(): Promise<Message> {
        for (const page of this.pages.values()) {
            await page._init(this);
        }

        const messageOptions = await this._assembleMessageContent();

        if (this.source instanceof Message) {
            this.message = await this.source.edit(messageOptions);
        } else if (this.source instanceof Interaction) {
            if (this.source.replied) {
                this.message = await this.source.editReply(messageOptions) as Message;
            } else {
                this.message = await this.source.reply({
                    ...messageOptions,
                    fetchReply: true,
                }) as Message;
            }
        } else {
            this.message = await this.source.send(messageOptions);
        }

        this.dirty = false;
        this.collector = this.message.createMessageComponentCollector({
            idle: 1000 * 60 * 60 * 12, // 12 hours
        });
        this.collector.on("collect", this._onInteraction.bind(this));

        return this.message;
    }

    public async update(): Promise<Message> {
        if (!this.message) {
            throw new Error("Can't update menu without initializing it first");
        }

        const messageOptions = await this._assembleMessageContent();

        if (this.lastInteraction) {
            this.message = await this.lastInteraction.update({
                ...messageOptions,
                fetchReply: true,
            }) as Message;
        } else {
            this.message = await this.message.edit(messageOptions);
        }

        this.dirty = false;
        return this.message;
    }

    public markDirty(): void {
        this.dirty = true;
    }

    private _isDirty(): boolean {
        return this.dirty || this._getCurrentPage()._isDirty();
    }

    private async _onInteraction(interaction: MessageComponentInteraction): Promise<void> {
        this.lastInteraction = interaction;
        await this._getCurrentPage()._onInteraction(interaction);
        if (this._isDirty()) {
            await this.update();
        } else if (!interaction.replied && !interaction.deferred) {
            await interaction.deferUpdate();
        }
    }

    private async _serialize(): Promise<MessageActionRowType[]> {
        return this._getCurrentPage()._serialize();
    }

    private _getCurrentPage(): MenuPage {
        if (!this.currentPageId) {
            throw new Error(`No current page ID has been set`);
        }
        const currentPage = this.pages.get(this.currentPageId);
        if (!currentPage) {
            throw new Error(`Unknown current page ID '${this.currentPageId}'`);
        }
        return currentPage;
    }

    private async _assembleMessageContent(): Promise<MessageOptions> {
        const messageComponents = await this._serialize();
        const messageOptionsWithoutComponents = await this._getCurrentPage()._getMessageOptions();
        const messageOptions: MessageOptions = {
            ...messageOptionsWithoutComponents,
            components: messageComponents,
        };
        return messageOptions;
    }

}
