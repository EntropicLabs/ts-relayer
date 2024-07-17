import { Logger } from "../../create-logger";
export type Flags = {
    readonly keyFile?: string;
};
export type Options = {
    readonly keyFile: string | null;
};
export declare function keysGenerate(flags: Flags, _logger: Logger): Promise<void>;
export declare function run(options: Options): void;
