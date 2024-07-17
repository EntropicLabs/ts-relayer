import { AckWithMetadata, RelayInfo } from "..";
export declare function setupContracts(contracts: Record<string, string>): Promise<Record<string, number>>;
export declare function assertAckSuccess(acks: AckWithMetadata[]): void;
export declare function assertAckErrors(acks: AckWithMetadata[]): void;
export declare function assertPacketsFromA(relay: RelayInfo, count: number, success: boolean): void;
export declare function assertPacketsFromB(relay: RelayInfo, count: number, success: boolean): void;
