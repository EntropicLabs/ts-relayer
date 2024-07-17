import { AppConfig } from "../../../types";
type Params = {
    keyFileFlag?: string;
    app: AppConfig | null;
};
export declare function resolveKeyFileOption({ keyFileFlag, app }: Params): string | null;
export {};
