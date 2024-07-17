"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPrometheus = void 0;
const http_1 = __importDefault(require("http"));
const prom_client_1 = __importDefault(require("prom-client"));
let initialized = false;
const prefix = "relayer";
const withPrefix = (name) => `${prefix}_${name}`;
function getMetrics() {
    return {
        loopTotal: new prom_client_1.default.Counter({
            name: withPrefix("loop_total"),
            help: "Total relayer loops.",
        }),
    };
}
function setupPrometheus({ enabled, port, logger, }) {
    if (initialized) {
        throw new Error(`"setupPrometheus" func shouldn't be initialized more than once.`);
    }
    initialized = true;
    if (!enabled) {
        return null;
    }
    prom_client_1.default.collectDefaultMetrics({ prefix: `${prefix}_` });
    const server = http_1.default.createServer(async (request, response) => {
        if (request.method === "GET" && request.url === "/metrics") {
            const metrics = await prom_client_1.default.register.metrics();
            response.writeHead(200, {
                "Content-Type": prom_client_1.default.register.contentType,
            });
            response.end(metrics);
            return;
        }
        response.writeHead(404);
        response.end("404");
    });
    server.listen(port);
    logger.info(`Prometheus GET /metrics exposed on port ${port}.`);
    return getMetrics();
}
exports.setupPrometheus = setupPrometheus;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dXAtcHJvbWV0aGV1cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9iaW5hcnkvaWJjLXJlbGF5ZXIvc2V0dXAtcHJvbWV0aGV1cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxnREFBd0I7QUFFeEIsOERBQWlDO0FBSWpDLElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQztBQUV4QixNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUM7QUFDekIsTUFBTSxVQUFVLEdBQUcsQ0FBQyxJQUFZLEVBQUUsRUFBRSxDQUFDLEdBQUcsTUFBTSxJQUFJLElBQUksRUFBRSxDQUFDO0FBRXpELFNBQVMsVUFBVTtJQUNqQixPQUFPO1FBQ0wsU0FBUyxFQUFFLElBQUkscUJBQU0sQ0FBQyxPQUFPLENBQUM7WUFDNUIsSUFBSSxFQUFFLFVBQVUsQ0FBQyxZQUFZLENBQUM7WUFDOUIsSUFBSSxFQUFFLHNCQUFzQjtTQUM3QixDQUFDO0tBQ0gsQ0FBQztBQUNKLENBQUM7QUFLRCxTQUFnQixlQUFlLENBQUMsRUFDOUIsT0FBTyxFQUNQLElBQUksRUFDSixNQUFNLEdBS1A7SUFDQyxJQUFJLFdBQVcsRUFBRTtRQUNmLE1BQU0sSUFBSSxLQUFLLENBQ2IsaUVBQWlFLENBQ2xFLENBQUM7S0FDSDtJQUNELFdBQVcsR0FBRyxJQUFJLENBQUM7SUFFbkIsSUFBSSxDQUFDLE9BQU8sRUFBRTtRQUNaLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFFRCxxQkFBTSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZELE1BQU0sTUFBTSxHQUFHLGNBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsRUFBRTtRQUMzRCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssS0FBSyxJQUFJLE9BQU8sQ0FBQyxHQUFHLEtBQUssVUFBVSxFQUFFO1lBQzFELE1BQU0sT0FBTyxHQUFHLE1BQU0scUJBQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEQsUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3RCLGNBQWMsRUFBRSxxQkFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXO2FBQzVDLENBQUMsQ0FBQztZQUNILFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFdEIsT0FBTztTQUNSO1FBRUQsUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN4QixRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3RCLENBQUMsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwQixNQUFNLENBQUMsSUFBSSxDQUFDLDJDQUEyQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBRWhFLE9BQU8sVUFBVSxFQUFFLENBQUM7QUFDdEIsQ0FBQztBQXZDRCwwQ0F1Q0MifQ==