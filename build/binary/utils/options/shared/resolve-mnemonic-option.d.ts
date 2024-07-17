import { AppConfig } from "../../../types";
type Params = {
    interactiveFlag: boolean;
    mnemonicFlag?: string;
    keyFile: string | null;
    app: AppConfig | null;
};
export declare function resolveMnemonicOption(params: Params, optional: true): Promise<string | null>;
export declare function resolveMnemonicOption(params: Params, optional?: false): Promise<string>;
export {};
