"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAndValidateApp = void 0;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const ajv_1 = __importDefault(require("ajv"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const constants_1 = require("../constants");
const is_no_exist_error_1 = require("./is-no-exist-error");
function readAppYaml(filepath) {
    try {
        return fs_1.default.readFileSync(filepath, "utf-8");
    }
    catch (error) {
        if ((0, is_no_exist_error_1.isNoExistError)(error)) {
            throw error;
        }
        return null;
    }
}
function loadAndValidateApp(home) {
    const appContents = readAppYaml(path_1.default.join(home, constants_1.appFile));
    if (!appContents) {
        return null;
    }
    const app = js_yaml_1.default.load(appContents);
    const ajv = new ajv_1.default({ allErrors: true });
    const schema = {
        type: "object",
        additionalProperties: false,
        required: [],
        properties: {
            src: { type: "string", nullable: true, default: null },
            srcConnection: { type: "string", nullable: true, default: null },
            dest: { type: "string", nullable: true },
            destConnection: { type: "string", nullable: true },
            mnemonic: { type: "string", nullable: true },
            keyFile: { type: "string", nullable: true },
            enableMetrics: { type: "boolean", nullable: true },
            metricsPort: { type: "number", nullable: true },
        },
    };
    const validate = ajv.compile(schema);
    if (!validate(app)) {
        const errors = (validate.errors ?? []).map(({ dataPath, message }) => `"${dataPath}" ${message}`);
        throw new Error([`${constants_1.appFile} validation failed.`, ...errors].join(os_1.default.EOL));
    }
    return app;
}
exports.loadAndValidateApp = loadAndValidateApp;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZC1hbmQtdmFsaWRhdGUtYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2JpbmFyeS91dGlscy9sb2FkLWFuZC12YWxpZGF0ZS1hcHAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsNENBQW9CO0FBQ3BCLDRDQUFvQjtBQUNwQixnREFBd0I7QUFFeEIsOENBQTBDO0FBQzFDLHNEQUEyQjtBQUUzQiw0Q0FBdUM7QUFHdkMsMkRBQXFEO0FBRXJELFNBQVMsV0FBVyxDQUFDLFFBQWdCO0lBQ25DLElBQUk7UUFDRixPQUFPLFlBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQzNDO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxJQUFJLElBQUEsa0NBQWMsRUFBQyxLQUFLLENBQUMsRUFBRTtZQUN6QixNQUFNLEtBQUssQ0FBQztTQUNiO1FBRUQsT0FBTyxJQUFJLENBQUM7S0FDYjtBQUNILENBQUM7QUFFRCxTQUFnQixrQkFBa0IsQ0FBQyxJQUFZO0lBQzdDLE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxtQkFBTyxDQUFDLENBQUMsQ0FBQztJQUUxRCxJQUFJLENBQUMsV0FBVyxFQUFFO1FBQ2hCLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFFRCxNQUFNLEdBQUcsR0FBRyxpQkFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUVuQyxNQUFNLEdBQUcsR0FBRyxJQUFJLGFBQUcsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3pDLE1BQU0sTUFBTSxHQUE4QjtRQUN4QyxJQUFJLEVBQUUsUUFBUTtRQUNkLG9CQUFvQixFQUFFLEtBQUs7UUFDM0IsUUFBUSxFQUFFLEVBQUU7UUFDWixVQUFVLEVBQUU7WUFDVixHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtZQUN0RCxhQUFhLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtZQUNoRSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7WUFDeEMsY0FBYyxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFO1lBQ2xELFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRTtZQUM1QyxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7WUFDM0MsYUFBYSxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFO1lBQ2xELFdBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRTtTQUNoRDtLQUNGLENBQUM7SUFDRixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRXJDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDbEIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FDeEMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxRQUFRLEtBQUssT0FBTyxFQUFFLENBQ3RELENBQUM7UUFDRixNQUFNLElBQUksS0FBSyxDQUFDLENBQUMsR0FBRyxtQkFBTyxxQkFBcUIsRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztLQUM1RTtJQUVELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQW5DRCxnREFtQ0MifQ==