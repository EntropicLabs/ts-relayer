#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.program = void 0;
const commander_1 = require("commander");
const commander_options_1 = require("../commander-options");
const logger_with_error_boundary_1 = require("../utils/logger-with-error-boundary");
const balances_1 = require("./commands/balances");
const channel_1 = require("./commands/channel");
const channels_1 = require("./commands/channels");
const connect_1 = require("./commands/connect");
const connections_1 = require("./commands/connections");
const ics20_1 = require("./commands/ics20");
const init_1 = require("./commands/init");
const keys_generate_1 = require("./commands/keys-generate");
const keys_list_1 = require("./commands/keys-list");
exports.program = new commander_1.Command();
exports.program.helpOption(...commander_options_1.helpOptions);
exports.program.addHelpCommand(false);
exports.program.description("Collection of commands to quickly setup a relayer");
const initCommand = exports.program
    .command("init")
    .description("Initialize relayer's home directory with registry.yaml and app.yaml configuration files")
    .addOption(commander_options_1.homeOption)
    .addOption(commander_options_1.srcOption)
    .addOption(commander_options_1.destOption)
    .option("--registry-from <path>", "Copy existing relayer registry from given home directory")
    .action((0, logger_with_error_boundary_1.loggerWithErrorBoundary)(init_1.init));
(0, commander_options_1.addLoggerOptionsTo)(initCommand);
const ics20Command = exports.program
    .command("ics20")
    .description("Create new unordered channel (ics20-1) for given chains, ports, and connections")
    .addOption(commander_options_1.homeOption)
    .addOption(commander_options_1.srcTrust)
    .addOption(commander_options_1.destTrust)
    .addOption(commander_options_1.mnemonicOption)
    .addOption((0, commander_options_1.srcPort)(` (default: ${ics20_1.defaults.port})`))
    .addOption((0, commander_options_1.destPort)(` (default: ${ics20_1.defaults.port})`))
    .action((0, logger_with_error_boundary_1.loggerWithErrorBoundary)(ics20_1.ics20));
(0, commander_options_1.addLoggerOptionsTo)(ics20Command);
const keys = exports.program.command("keys").description("Manage application keys");
const keysGenerateCommand = keys
    .command("generate")
    .description("Generate 12 words length mnemonic")
    .addOption((0, commander_options_1.keyFileOption)("write"))
    .action((0, logger_with_error_boundary_1.loggerWithErrorBoundary)(keys_generate_1.keysGenerate));
(0, commander_options_1.addLoggerOptionsTo)(keysGenerateCommand);
const keysListCommand = keys
    .command("list")
    .description("Print addresses for registry chains")
    .addOption(commander_options_1.homeOption)
    .addOption(commander_options_1.mnemonicOption)
    .addOption((0, commander_options_1.keyFileOption)("read"))
    .addOption(commander_options_1.interactiveOption)
    .action((0, logger_with_error_boundary_1.loggerWithErrorBoundary)(keys_list_1.keysList));
(0, commander_options_1.addLoggerOptionsTo)(keysListCommand);
const balancesCommand = exports.program
    .command("balances")
    .description("Query balances for registry chains with non-zero amount")
    .addOption(commander_options_1.homeOption)
    .addOption(commander_options_1.mnemonicOption)
    .addOption((0, commander_options_1.keyFileOption)("read"))
    .addOption(commander_options_1.interactiveOption)
    .action((0, logger_with_error_boundary_1.loggerWithErrorBoundary)(balances_1.balances));
(0, commander_options_1.addLoggerOptionsTo)(balancesCommand);
const connectCommand = exports.program
    .command("connect")
    .description("Create and store new connections for given chains")
    .addOption(commander_options_1.homeOption)
    .addOption(commander_options_1.mnemonicOption)
    .addOption((0, commander_options_1.keyFileOption)("read"))
    .addOption(commander_options_1.interactiveOption)
    .addOption(commander_options_1.srcTrust)
    .addOption(commander_options_1.destTrust)
    .action((0, logger_with_error_boundary_1.loggerWithErrorBoundary)(connect_1.connect));
(0, commander_options_1.addLoggerOptionsTo)(connectCommand);
const channelsCommand = exports.program
    .command("channels")
    .description("Query channels on given chain and optionally filter by port")
    .addOption(commander_options_1.homeOption)
    .addOption(commander_options_1.mnemonicOption)
    .addOption(commander_options_1.interactiveOption)
    .addOption(commander_options_1.chainOption)
    .option("--connection <connection-id>", "Filter channels by connection id")
    .option("--port <port>", "Filter channels by port")
    .action((0, logger_with_error_boundary_1.loggerWithErrorBoundary)(channels_1.channels));
(0, commander_options_1.addLoggerOptionsTo)(channelsCommand);
const channelCommand = exports.program
    .command("channel")
    .description("Create new channel for given options")
    .addOption(commander_options_1.homeOption)
    .addOption(commander_options_1.mnemonicOption)
    .addOption(commander_options_1.interactiveOption)
    .addOption((0, commander_options_1.keyFileOption)("read"))
    .addOption(commander_options_1.srcConnection)
    .addOption(commander_options_1.destConnection)
    .addOption((0, commander_options_1.srcPort)())
    .addOption((0, commander_options_1.destPort)())
    .option("--ordered")
    .option("--version <version>", `(default: ${channel_1.defaults.version})`)
    .action((0, logger_with_error_boundary_1.loggerWithErrorBoundary)(channel_1.channel));
(0, commander_options_1.addLoggerOptionsTo)(channelCommand);
const connectionsCommand = exports.program
    .command("connections")
    .description("Query connections for given chain")
    .addOption(commander_options_1.homeOption)
    .addOption(commander_options_1.mnemonicOption)
    .addOption(commander_options_1.interactiveOption)
    .addOption(commander_options_1.chainOption)
    .action((0, logger_with_error_boundary_1.loggerWithErrorBoundary)(connections_1.connections));
(0, commander_options_1.addLoggerOptionsTo)(connectionsCommand);
// We don't have top-level await in commonjs
exports.program.parseAsync(process.argv).then(() => process.exit(0), (err) => {
    console.error(err);
    process.exit(5);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYmluYXJ5L2liYy1zZXR1cC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBRUEseUNBQW9DO0FBRXBDLDREQWdCOEI7QUFDOUIsb0ZBQThFO0FBRTlFLGtEQUErQztBQUMvQyxnREFBMEU7QUFDMUUsa0RBQStDO0FBQy9DLGdEQUE2QztBQUM3Qyx3REFBcUQ7QUFDckQsNENBQW9FO0FBQ3BFLDBDQUF1QztBQUN2Qyw0REFBd0Q7QUFDeEQsb0RBQWdEO0FBRW5DLFFBQUEsT0FBTyxHQUFHLElBQUksbUJBQU8sRUFBRSxDQUFDO0FBRXJDLGVBQU8sQ0FBQyxVQUFVLENBQUMsR0FBRywrQkFBVyxDQUFDLENBQUM7QUFDbkMsZUFBTyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUU5QixlQUFPLENBQUMsV0FBVyxDQUFDLG1EQUFtRCxDQUFDLENBQUM7QUFFekUsTUFBTSxXQUFXLEdBQUcsZUFBTztLQUN4QixPQUFPLENBQUMsTUFBTSxDQUFDO0tBQ2YsV0FBVyxDQUNWLHlGQUF5RixDQUMxRjtLQUNBLFNBQVMsQ0FBQyw4QkFBVSxDQUFDO0tBQ3JCLFNBQVMsQ0FBQyw2QkFBUyxDQUFDO0tBQ3BCLFNBQVMsQ0FBQyw4QkFBVSxDQUFDO0tBQ3JCLE1BQU0sQ0FDTCx3QkFBd0IsRUFDeEIsMERBQTBELENBQzNEO0tBQ0EsTUFBTSxDQUFDLElBQUEsb0RBQXVCLEVBQUMsV0FBSSxDQUFDLENBQUMsQ0FBQztBQUN6QyxJQUFBLHNDQUFrQixFQUFDLFdBQVcsQ0FBQyxDQUFDO0FBRWhDLE1BQU0sWUFBWSxHQUFHLGVBQU87S0FDekIsT0FBTyxDQUFDLE9BQU8sQ0FBQztLQUNoQixXQUFXLENBQ1YsaUZBQWlGLENBQ2xGO0tBQ0EsU0FBUyxDQUFDLDhCQUFVLENBQUM7S0FDckIsU0FBUyxDQUFDLDRCQUFRLENBQUM7S0FDbkIsU0FBUyxDQUFDLDZC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