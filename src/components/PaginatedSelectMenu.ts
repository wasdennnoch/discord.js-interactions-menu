import { MessageActionRowComponentOptions, MessageSelectMenuOptions, MessageSelectOptionData, SelectMenuInteraction } from "discord.js";
import MenuComponent from "../MenuComponent";
import { EMOJI, splitToPages } from "../Utils";

interface State {
    currentPage: number;
}

type Options = Omit<MessageSelectMenuOptions, "customId">;

export default class PaginatedSelectMenu extends MenuComponent<State, Options, SelectMenuInteraction> {

    public async init(): Promise<void> {
        this.state.currentPage = 0;
    }

    public async serialize(): Promise<MessageActionRowComponentOptions> {
        return {
            type: "SELECT_MENU",
            customId: this.id,
            ...this.options,
            options: this.getCurrentOptionsPage(),
        };
    }

    private getCurrentOptionsPage(): MessageSelectOptionData[] {
        const pages = splitToPages(this.options.options ?? [], 20, 4);
        const pagesWithPagination = pages.map((options, i) => {
            if (i !== pages.length - 1) {
                options.push({
                    label: "Next",
                    value: `${this.id}-next`,
                    emoji: EMOJI.PAGINATION.NEXT,
                });
            }
            if (i !== 0) {
                options.unshift({
                    label: `Previous`,
                    value: `${this.id}-previous`,
                    emoji: EMOJI.PAGINATION.PREVIOUS,
                });
            }
            return options;
        });
        return pagesWithPagination[this.state.currentPage];
    }

}
