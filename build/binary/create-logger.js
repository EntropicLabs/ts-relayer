"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = exports.resolveLevel = exports.defaultLevel = exports.levels = void 0;
const fast_safe_stringify_1 = __importDefault(require("fast-safe-stringify"));
const triple_beam_1 = require("triple-beam");
const winston_1 = __importDefault(require("winston"));
const resolve_option_1 = require("./utils/options/resolve-option");
exports.levels = {
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
    debug: 4,
};
exports.defaultLevel = "info"; // if not provided
function validateLevel(level) {
    return level ? Object.keys(exports.levels).includes(level) : false;
}
function resolveLevel(flags) {
    const level = (0, resolve_option_1.resolveOption)("logLevel")(flags.logLevel, process.env.RELAYER_LOG_LEVEL);
    if (level !== null && !validateLevel(level)) {
        return [exports.defaultLevel, level];
    }
    const levelValue = exports.levels[level ?? "error"];
    if (flags.verbose && levelValue < exports.levels.verbose) {
        return ["verbose", null];
    }
    if (flags.quiet && levelValue <= exports.levels.error) {
        return ["error", null];
    }
    if (level) {
        return [level, null];
    }
    return [exports.defaultLevel, null];
}
exports.resolveLevel = resolveLevel;
function createLogger(flags) {
    const [level, invalidInputLevel] = resolveLevel(flags);
    const fileTransport = flags.logFile
        ? [
            new winston_1.default.transports.File({
                handleExceptions: true,
                filename: flags.logFile,
                format: winston_1.default.format.combine(winston_1.default.format.timestamp()),
            }),
        ]
        : [];
    const logger = winston_1.default.createLogger({
        level,
        levels: exports.levels,
        format: winston_1.default.format.combine(winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
        transports: [
            new winston_1.default.transports.Console({
                handleExceptions: true,
                format: winston_1.default.format.combine(winston_1.default.format.colorize(), simpleFormat(flags.stackTrace)),
            }),
            ...fileTransport,
        ],
    });
    if (invalidInputLevel !== null) {
        logger.error(`Invalid log-level "${invalidInputLevel}". Please use one of: ${Object.keys(exports.levels)
            .map((level) => `"${level}"`)
            .join(", ")}`);
    }
    return logger;
}
exports.createLogger = createLogger;
// Heavily based on https://github.com/winstonjs/logform/blob/master/simple.js
function simpleFormat(stackTrace) {
    return winston_1.default.format((info) => {
        let stringifiedRest = (0, fast_safe_stringify_1.default)({
            ...info,
            level: undefined,
            message: undefined,
            label: undefined,
            ...(stackTrace ? {} : { stack: undefined }), // remove `stack` from the output if no --stack-trace is provided
        });
        stringifiedRest = stringifiedRest !== "{}" ? ` ${stringifiedRest}` : "";
        const label = info.label ? ` [${info.label}]` : "";
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: indexing with symbols: https://github.com/microsoft/TypeScript/issues/1863
        info[triple_beam_1.MESSAGE] = `${info.level}:${label} ${info.message}${stringifiedRest}`;
        return info;
    })();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWxvZ2dlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9iaW5hcnkvY3JlYXRlLWxvZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw4RUFBZ0Q7QUFDaEQsNkNBQXNDO0FBQ3RDLHNEQUE4QjtBQUc5QixtRUFBK0Q7QUFPbEQsUUFBQSxNQUFNLEdBQUc7SUFDcEIsS0FBSyxFQUFFLENBQUM7SUFDUixJQUFJLEVBQUUsQ0FBQztJQUNQLElBQUksRUFBRSxDQUFDO0lBQ1AsT0FBTyxFQUFFLENBQUM7SUFDVixLQUFLLEVBQUUsQ0FBQztDQUNULENBQUM7QUFHVyxRQUFBLFlBQVksR0FBRyxNQUFNLENBQUMsQ0FBQyxrQkFBa0I7QUFFdEQsU0FBUyxhQUFhLENBQUMsS0FBb0I7SUFDekMsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBTSxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDN0QsQ0FBQztBQUVELFNBQWdCLFlBQVksQ0FDMUIsS0FBa0I7SUFFbEIsTUFBTSxLQUFLLEdBQUcsSUFBQSw4QkFBYSxFQUFDLFVBQVUsQ0FBQyxDQUNyQyxLQUFLLENBQUMsUUFBUSxFQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQzlCLENBQUM7SUFFRixJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDM0MsT0FBTyxDQUFDLG9CQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDOUI7SUFFRCxNQUFNLFVBQVUsR0FBRyxjQUFNLENBQUMsS0FBSyxJQUFJLE9BQU8sQ0FBQyxDQUFDO0lBRTVDLElBQUksS0FBSyxDQUFDLE9BQU8sSUFBSSxVQUFVLEdBQUcsY0FBTSxDQUFDLE9BQU8sRUFBRTtRQUNoRCxPQUFPLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzFCO0lBRUQsSUFBSSxLQUFLLENBQUMsS0FBSyxJQUFJLFVBQVUsSUFBSSxjQUFNLENBQUMsS0FBSyxFQUFFO1FBQzdDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDeEI7SUFFRCxJQUFJLEtBQUssRUFBRTtRQUNULE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDdEI7SUFFRCxPQUFPLENBQUMsb0JBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUM5QixDQUFDO0FBM0JELG9DQTJCQztBQUVELFNBQWdCLFlBQVksQ0FBQyxLQUFrQjtJQUM3QyxNQUFNLENBQUMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXZELE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxPQUFPO1FBQ2pDLENBQUMsQ0FBQztZQUNFLElBQUksaUJBQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUMxQixnQkFBZ0IsRUFBRSxJQUFJO2dCQUN0QixRQUFRLEVBQUUsS0FBSyxDQUFDLE9BQU87Z0JBQ3ZCLE1BQU0sRUFBRSxpQkFBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsaUJBQU8sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7YUFDM0QsQ0FBQztTQUNIO1FBQ0gsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUVQLE1BQU0sTUFBTSxHQUFHLGlCQUFPLENBQUMsWUFBWSxDQUFDO1FBQ2xDLEtBQUs7UUFDTCxNQUFNLEVBQU4sY0FBTTtRQUNOLE1BQU0sRUFBRSxpQkFBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQzVCLGlCQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUN0QyxpQkFBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FDdEI7UUFDRCxVQUFVLEVBQUU7WUFDVixJQUFJLGlCQUFPLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQztnQkFDN0IsZ0JBQWdCLEVBQUUsSUFBSTtnQkFDdEIsTUFBTSxFQUFFLGlCQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FDNUIsaUJBQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQ3pCLFlBQVksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQy9CO2FBQ0YsQ0FBQztZQUVGLEdBQUcsYUFBYTtTQUNqQjtLQUNGLENBQUMsQ0FBQztJQUVILElBQUksaUJBQWlCLEtBQUssSUFBSSxFQUFFO1FBQzlCLE1BQU0sQ0FBQyxLQUFLLENBQ1Ysc0JBQXNCLGlCQUFpQix5QkFBeUIsTUFBTSxDQUFDLElBQUksQ0FDekUsY0FBTSxDQUNQO2FBQ0UsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDO2FBQzVCLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUNoQixDQUFDO0tBQ0g7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBNUNELG9DQTRDQztBQUVELDhFQUE4RTtBQUM5RSxTQUFTLFlBQVksQ0FBQyxVQUFtQjtJQUN2QyxPQUFPLGlCQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBdUMsRUFBRSxFQUFFO1FBQ2hFLElBQUksZUFBZSxHQUFHLElBQUEsNkJBQWEsRUFBQztZQUNsQyxHQUFHLElBQUk7WUFDUCxLQUFLLEVBQUUsU0FBUztZQUNoQixPQUFPLEVBQUUsU0FBUztZQUNsQixLQUFLLEVBQUUsU0FBUztZQUVoQixHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsaUVBQWlFO1NBQy9HLENBQUMsQ0FBQztRQUNILGVBQWUsR0FBRyxlQUFlLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFFeEUsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUVuRCw2REFBNkQ7UUFDN0QseUZBQXlGO1FBQ3pGLElBQUksQ0FBQyxxQkFBTyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLGVBQWUsRUFBRSxDQUFDO1FBRTNFLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUNQLENBQUMifQ==