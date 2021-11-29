import { ButtonInteraction, MessageActionRowComponentOptions, MessageButtonOptions } from "discord.js";
import MenuComponent from "../MenuComponent";

type Options = Omit<MessageButtonOptions, "customId">;

export default class Button extends MenuComponent<{}, Options, ButtonInteraction> {

    public async serialize(): Promise<MessageActionRowComponentOptions> {
        return {
            type: "BUTTON",
            customId: this.id,
            ...this.options,
        };
    }

}
