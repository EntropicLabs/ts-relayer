import { Logger } from "../../create-logger";
export type Flags = {
    readonly home?: string;
    readonly chain?: string;
    readonly mnemonic?: string;
    readonly keyFile?: string;
    readonly interactive: boolean;
};
export type Options = {
    readonly home: string;
    readonly chain: string;
    readonly mnemonic: string | null;
};
export declare function connections(flags: Flags, logger: Logger): Promise<void>;
export declare function run(options: Options, logger: Logger): Promise<void>;
