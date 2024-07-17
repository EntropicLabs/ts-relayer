"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAndValidateRegistry = void 0;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const ajv_1 = __importDefault(require("ajv"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const constants_1 = require("../constants");
function loadAndValidateRegistry(filepath) {
    const registry = js_yaml_1.default.load(fs_1.default.readFileSync(filepath, "utf-8"));
    const ajv = new ajv_1.default({ allErrors: true });
    const schema = {
        type: "object",
        required: ["chains", "version"],
        additionalProperties: false,
        properties: {
            version: {
                type: "number",
            },
            chains: {
                type: "object",
                minProperties: 2,
                required: [],
                additionalProperties: false,
                patternProperties: {
                    "^(.*)$": {
                        type: "object",
                        required: ["chain_id", "gas_price", "prefix", "rpc"],
                        additionalProperties: false,
                        properties: {
                            chain_id: { type: "string" },
                            prefix: { type: "string" },
                            gas_price: { type: "string" },
                            faucet: { type: "string", nullable: true },
                            hd_path: { type: "string", nullable: true },
                            ics20_port: { type: "string", nullable: true },
                            rpc: { type: "array", items: { type: "string" }, minItems: 1 },
                            estimated_block_time: { type: "number", nullable: true },
                            estimated_indexer_time: { type: "number", nullable: true },
                        },
                    },
                },
            },
        },
    };
    const validate = ajv.compile(schema);
    if (!validate(registry)) {
        const errors = (validate.errors ?? []).map(({ dataPath, message }) => `"${dataPath}" ${message}`);
        throw new Error([`${constants_1.registryFile} validation failed.`, ...errors].join(os_1.default.EOL));
    }
    return registry;
}
exports.loadAndValidateRegistry = loadAndValidateRegistry;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZC1hbmQtdmFsaWRhdGUtcmVnaXN0cnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYmluYXJ5L3V0aWxzL2xvYWQtYW5kLXZhbGlkYXRlLXJlZ2lzdHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDRDQUFvQjtBQUNwQiw0Q0FBb0I7QUFFcEIsOENBQTBDO0FBQzFDLHNEQUEyQjtBQUUzQiw0Q0FBNEM7QUFHNUMsU0FBZ0IsdUJBQXVCLENBQUMsUUFBZ0I7SUFDdEQsTUFBTSxRQUFRLEdBQUcsaUJBQUksQ0FBQyxJQUFJLENBQUMsWUFBRSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUUvRCxNQUFNLEdBQUcsR0FBRyxJQUFJLGFBQUcsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3pDLE1BQU0sTUFBTSxHQUE2QjtRQUN2QyxJQUFJLEVBQUUsUUFBUTtRQUNkLFFBQVEsRUFBRSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUM7UUFDL0Isb0JBQW9CLEVBQUUsS0FBSztRQUMzQixVQUFVLEVBQUU7WUFDVixPQUFPLEVBQUU7Z0JBQ1AsSUFBSSxFQUFFLFFBQVE7YUFDZjtZQUNELE1BQU0sRUFBRTtnQkFDTixJQUFJLEVBQUUsUUFBUTtnQkFDZCxhQUFhLEVBQUUsQ0FBQztnQkFDaEIsUUFBUSxFQUFFLEVBQUU7Z0JBQ1osb0JBQW9CLEVBQUUsS0FBSztnQkFDM0IsaUJBQWlCLEVBQUU7b0JBQ2pCLFFBQVEsRUFBRTt3QkFDUixJQUFJLEVBQUUsUUFBUTt3QkFDZCxRQUFRLEVBQUUsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUM7d0JBQ3BELG9CQUFvQixFQUFFLEtBQUs7d0JBQzNCLFVBQVUsRUFBRTs0QkFDVixRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFOzRCQUM1QixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFOzRCQUMxQixTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFOzRCQUM3QixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7NEJBQzFDLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRTs0QkFDM0MsVUFBVSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFOzRCQUM5QyxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFOzRCQUM5RCxvQkFBb0IsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRTs0QkFDeEQsc0JBQXNCLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7eUJBQzNEO3FCQUNGO2lCQUNGO2FBQ0Y7U0FDRjtLQUNGLENBQUM7SUFDRixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3JDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDdkIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FDeEMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxRQUFRLEtBQUssT0FBTyxFQUFFLENBQ3RELENBQUM7UUFDRixNQUFNLElBQUksS0FBSyxDQUNiLENBQUMsR0FBRyx3QkFBWSxxQkFBcUIsRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFFLENBQUMsR0FBRyxDQUFDLENBQy9ELENBQUM7S0FDSDtJQUVELE9BQU8sUUFBUSxDQUFDO0FBQ2xCLENBQUM7QUFqREQsMERBaURDIn0=