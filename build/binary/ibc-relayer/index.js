#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const commander_options_1 = require("../commander-options");
const logger_with_error_boundary_1 = require("../utils/logger-with-error-boundary");
const start_1 = require("./commands/start");
const program = new commander_1.Command();
program.helpOption(...commander_options_1.helpOptions);
program.addHelpCommand(false);
program.description("Typescript implementation of an IBC relayer");
const startCommand = program
    .command("start")
    .description("Relay all packets over all channels on pre-configured connection")
    .addOption(commander_options_1.homeOption)
    .addOption(commander_options_1.srcOption)
    .addOption(commander_options_1.destOption)
    .addOption(commander_options_1.interactiveOption)
    .addOption((0, commander_options_1.keyFileOption)("read"))
    .addOption(commander_options_1.mnemonicOption)
    .addOption(commander_options_1.srcConnection)
    .addOption(commander_options_1.destConnection)
    .option("--enable-metrics", "Enable Prometheus metrics collection and GET /metrics endpoint")
    .option(`--metrics-port <port>', 'Specify port for GET /metrics http server (default: ${start_1.defaults.metricsPort})`)
    .option("--poll <frequency>", `How many seconds we sleep between checking for packets (default: ${start_1.defaults.poll})`)
    .option("--max-age-src <seconds>", `How old can the client on src chain be, before we update it (default: ${start_1.defaults.maxAgeSrc})`)
    .option("--max-age-dest <seconds>", `How old can the client on dest chain be, before we update it (default: ${start_1.defaults.maxAgeDest})`)
    .option("--scan-from-src <height>")
    .option("--scan-from-dest <height>")
    // note: once is designed for debugging and unit tests
    .option("--once", "Relay pending packets and quit, no polling")
    .action((0, logger_with_error_boundary_1.loggerWithErrorBoundary)(start_1.start));
(0, commander_options_1.addLoggerOptionsTo)(startCommand);
// We don't have top-level await in commonjs
program.parseAsync(process.argv).then(() => process.exit(0), (err) => {
    console.error(err);
    process.exit(5);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYmluYXJ5L2liYy1yZWxheWVyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLHlDQUFvQztBQUVwQyw0REFXOEI7QUFDOUIsb0ZBQThFO0FBRTlFLDRDQUFvRTtBQUVwRSxNQUFNLE9BQU8sR0FBRyxJQUFJLG1CQUFPLEVBQUUsQ0FBQztBQUU5QixPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsK0JBQVcsQ0FBQyxDQUFDO0FBQ25DLE9BQU8sQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7QUFFOUIsT0FBTyxDQUFDLFdBQVcsQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO0FBRW5FLE1BQU0sWUFBWSxHQUFHLE9BQU87S0FDekIsT0FBTyxDQUFDLE9BQU8sQ0FBQztLQUNoQixXQUFXLENBQ1Ysa0VBQWtFLENBQ25FO0tBQ0EsU0FBUyxDQUFDLDhCQUFVLENBQUM7S0FDckIsU0FBUyxDQUFDLDZCQUFTLENBQUM7S0FDcEIsU0FBUyxDQUFDLDhCQUFVLENBQUM7S0FDckIsU0FBUyxDQUFDLHFDQUFpQixDQUFDO0tBQzVCLFNBQVMsQ0FBQyxJQUFBLGlDQUFhLEVBQUMsTUFBTSxDQUFDLENBQUM7S0FDaEMsU0FBUyxDQUFDLGtDQUFjLENBQUM7S0FDekIsU0FBUyxDQUFDLGlDQUFhLENBQUM7S0FDeEIsU0FBUyxDQUFDLGtDQUFjLENBQUM7S0FDekIsTUFBTSxDQUNMLGtCQUFrQixFQUNsQixnRUFBZ0UsQ0FDakU7S0FDQSxNQUFNLENBQ0wsZ0ZBQWdGLGdCQUFhLENBQUMsV0FBVyxHQUFHLENBQzdHO0tBQ0EsTUFBTSxDQUNMLG9CQUFvQixFQUNwQixvRUFBb0UsZ0JBQWEsQ0FBQyxJQUFJLEdBQUcsQ0FDMUY7S0FDQSxNQUFNLENBQ0wseUJBQXlCLEVBQ3pCLHlFQUF5RSxnQkFBYSxDQUFDLFNBQVMsR0FBRyxDQUNwRztLQUNBLE1BQU0sQ0FDTCwwQkFBMEIsRUFDMUIsMEVBQTBFLGdCQUFhLENBQUMsVUFBVSxHQUFHLENBQ3RHO0tBQ0EsTUFBTSxDQUFDLDBCQUEwQixDQUFDO0tBQ2xDLE1BQU0sQ0FBQywyQkFBMkIsQ0FBQztJQUNwQyxzREFBc0Q7S0FDckQsTUFBTSxDQUFDLFFBQVEsRUFBRSw0Q0FBNEMsQ0FBQztLQUM5RCxNQUFNLENBQUMsSUFBQSxvREFBdUIsRUFBQyxhQUFLLENBQUMsQ0FBQyxDQUFDO0FBRTFDLElBQUEsc0NBQWtCLEVBQUMsWUFBWSxDQUFDLENBQUM7QUFFakMsNENBQTRDO0FBQzVDLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FDbkMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFDckIsQ0FBQyxHQUFHLEVBQUUsRUFBRTtJQUNOLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDbkIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDLENBQ0YsQ0FBQyJ9