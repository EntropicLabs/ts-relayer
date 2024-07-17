import { State as ChannelState } from "cosmjs-types/ibc/core/channel/v1/channel";
import { Logger } from "../../create-logger";
export type Flags = {
    readonly home?: string;
    readonly port?: string;
    readonly connection?: string;
    readonly chain?: string;
    readonly mnemonic?: string;
    readonly keyFile?: string;
    readonly interactive: boolean;
};
export type Options = {
    readonly home: string;
    readonly chain: string;
    readonly mnemonic: string | null;
    readonly port: string | null;
    readonly connection: string | null;
};
export declare function channels(flags: Flags, logger: Logger): Promise<void>;
export declare function channelStateAsText(state: ChannelState): "Closed" | "Init" | "Open" | "Tryopen" | "UninitializedUnspecified" | "Unrecognized";
export declare function run(options: Options, logger: Logger): Promise<void>;
