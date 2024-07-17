"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ava_1 = __importDefault(require("ava"));
const axios_1 = __importDefault(require("axios"));
const sinon_1 = __importDefault(require("sinon"));
const constants_1 = require("../../constants");
const init_1 = require("./init");
const fsExistSync = sinon_1.default.stub(fs_1.default, "existsSync");
const fsMkdirSync = sinon_1.default.stub(fs_1.default, "mkdirSync");
const axiosGet = sinon_1.default.stub(axios_1.default, "get");
const fsReadFileSync = sinon_1.default.stub(fs_1.default, "readFileSync");
const fsWriteFileSync = sinon_1.default.stub(fs_1.default, "writeFileSync");
const fsCopyFileSync = sinon_1.default.stub(fs_1.default, "copyFileSync");
const consoleLog = sinon_1.default.stub(console, "log");
sinon_1.default.replace(fs_1.default, "lstatSync", sinon_1.default.fake.returns({
    isDirectory: () => true,
    isFile: () => true,
}));
const registryYaml = `
version: 1

chains:
  local_wasm:
    chain_id: testing
    prefix: wasm
    gas_price: 0.025ucosm
    hd_path: m/44'/108'/0'/2'
    rpc:
      - http://localhost:26659
  local_gaia:
    chain_id: gaia-testing
    prefix: cosmos
    gas_price: 0.025uatom
    hd_path: m/44'/108'/0'/3'
    rpc:
      - http://localhost:26655`;
ava_1.default.beforeEach(() => {
    sinon_1.default.reset();
});
(0, ava_1.default)("creates app.yaml", async (t) => {
    const options = {
        home: "/home/user",
        src: "local_wasm",
        dest: "local_gaia",
        registryFrom: null,
    };
    const appPath = path_1.default.join(options.home, "app.yaml");
    const registryPath = path_1.default.join(options.home, "registry.yaml");
    fsExistSync
        .onCall(0)
        .returns(false)
        .onCall(1)
        .returns(true)
        .onCall(2)
        .returns(true);
    axiosGet.resolves({
        data: registryYaml,
    });
    fsReadFileSync.returns(registryYaml);
    fsWriteFileSync.returns();
    await (0, init_1.run)(options);
    t.assert(fsMkdirSync.notCalled);
    t.assert(axiosGet.notCalled);
    t.assert(fsReadFileSync.calledOnceWith(registryPath));
    const [calledAppPath, contents] = fsWriteFileSync.getCall(0).args;
    const appYamlRegexp = new RegExp(`src: ${options.src}\ndest: ${options.dest}\nmnemonic: [\\w ]+`, "mg");
    t.is(calledAppPath, appPath);
    t.regex(contents, appYamlRegexp);
    t.assert(consoleLog.getCall(-2).calledWithMatch(/Source address: [\w ]+/));
    t.assert(consoleLog.getCall(-1).calledWithMatch(/Destination address: [\w ]+/));
});
ava_1.default.only("initialize home directory, pull registry.yaml and create app.yaml", async (t) => {
    const options = {
        home: "/home/user",
        src: "local_wasm",
        dest: "local_gaia",
        registryFrom: null,
    };
    const appPath = path_1.default.join(options.home, "app.yaml");
    const registryPath = path_1.default.join(options.home, "registry.yaml");
    fsExistSync
        .onCall(0)
        .returns(false)
        .onCall(1)
        .returns(false)
        .onCall(2)
        .returns(false);
    fsMkdirSync.returns(options.home);
    axiosGet.resolves({
        data: registryYaml,
    });
    fsReadFileSync.returns(registryYaml);
    fsWriteFileSync.returns();
    await (0, init_1.run)(options);
    t.assert(fsMkdirSync.calledOnceWith(options.home));
    t.assert(axiosGet.calledOnce);
    t.assert(fsReadFileSync.calledOnceWith(registryPath));
    t.assert(fsWriteFileSync.calledWithExactly(registryPath, registryYaml));
    t.assert(consoleLog.calledWithMatch(new RegExp(`at ${options.home}`)));
    const [calledAppPath, contents] = fsWriteFileSync.getCall(1).args;
    const appYamlRegexp = new RegExp(`src: ${options.src}\ndest: ${options.dest}\nmnemonic: [\\w ]+`, "mg");
    t.is(calledAppPath, appPath);
    t.regex(contents, appYamlRegexp);
    t.assert(consoleLog.getCall(-2).calledWithMatch(/Source address: [\w ]+/));
    t.assert(consoleLog.getCall(-1).calledWithMatch(/Destination address: [\w ]+/));
});
(0, ava_1.default)("throws when cannot fetch registry.yaml from remote", async (t) => {
    const options = {
        home: "/home/user",
        src: "local_wasm",
        dest: "local_gaia",
        registryFrom: null,
    };
    fsExistSync.returns(false);
    fsMkdirSync.returns(options.home);
    axiosGet.rejects();
    fsReadFileSync.returns("");
    fsWriteFileSync.returns();
    await t.throwsAsync(async () => await (0, init_1.run)(options), {
        instanceOf: Error,
        message: /Cannot fetch registry.yaml/,
    });
    t.assert(fsMkdirSync.calledOnceWith(options.home));
    t.assert(axiosGet.calledOnce);
});
(0, ava_1.default)("returns early if app.yaml exists", async (t) => {
    const options = {
        home: "/home/user",
        src: "local_wasm",
        dest: "local_gaia",
        registryFrom: null,
    };
    fsExistSync.onCall(0).returns(true);
    await (0, init_1.run)(options);
    t.assert(fsExistSync.calledOnce);
    t.assert(consoleLog.calledWithMatch(/app.yaml is already initialized/));
    t.assert(consoleLog.calledOnce);
});
(0, ava_1.default)("throws if provided chain does not exist in the registry", async (t) => {
    const options = {
        home: "/home/user",
        src: "chain_that_does_not_exist",
        dest: "local_gaia",
        registryFrom: null,
    };
    const registryPath = path_1.default.join(options.home, "registry.yaml");
    fsExistSync
        .onCall(0)
        .returns(false)
        .onCall(1)
        .returns(true)
        .onCall(2)
        .returns(true);
    axiosGet.resolves({
        data: registryYaml,
    });
    fsReadFileSync.returns(registryYaml);
    await t.throwsAsync(async () => await (0, init_1.run)(options), {
        instanceOf: Error,
        message: new RegExp(`${options.src} is missing in the registry`),
    });
    t.assert(fsMkdirSync.notCalled);
    t.assert(axiosGet.notCalled);
    t.assert(fsReadFileSync.calledOnceWith(registryPath));
});
(0, ava_1.default)("copies existing registry", async (t) => {
    const options = {
        home: "/home/user",
        src: "local_wasm",
        dest: "local_gaia",
        registryFrom: "/home/user/.relayer-home",
    };
    const appPath = path_1.default.join(options.home, "app.yaml");
    const registryPath = path_1.default.join(options.home, "registry.yaml");
    fsExistSync.returns(false);
    fsMkdirSync.returns(options.home);
    fsReadFileSync.returns(registryYaml);
    fsWriteFileSync.returns();
    fsCopyFileSync.returns();
    await (0, init_1.run)(options);
    t.assert(axiosGet.notCalled);
    t.assert(fsReadFileSync.calledOnceWith(registryPath));
    t.assert(fsCopyFileSync.calledOnceWith(path_1.default.join(options.registryFrom, constants_1.registryFile), registryPath));
    const [calledAppPath, contents] = fsWriteFileSync.getCall(0).args;
    const appYamlRegexp = new RegExp(`src: ${options.src}\ndest: ${options.dest}\nmnemonic: [\\w ]+`, "mg");
    t.is(calledAppPath, appPath);
    t.regex(contents, appYamlRegexp);
    t.assert(consoleLog.getCall(-2).calledWithMatch(/Source address: [\w ]+/));
    t.assert(consoleLog.getCall(-1).calledWithMatch(/Destination address: [\w ]+/));
});
(0, ava_1.default)('exits earlier when "src" and "dest" are not set', async (t) => {
    const options = {
        home: "/home/user",
        src: null,
        dest: null,
        registryFrom: null,
    };
    fsExistSync.onCall(0).returns(false).onCall(1).returns(false);
    axiosGet.resolves({
        data: registryYaml,
    });
    fsReadFileSync.returns(registryYaml);
    fsWriteFileSync.returns();
    await (0, init_1.run)(options);
    t.assert(consoleLog.getCall(-1).calledWithMatch(/Exited earlier/));
    t.is(fsExistSync.callCount, 3);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC5zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2JpbmFyeS9pYmMtc2V0dXAvY29tbWFuZHMvaW5pdC5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsNENBQW9CO0FBQ3BCLGdEQUF3QjtBQUV4Qiw4Q0FBdUI7QUFDdkIsa0RBQTBCO0FBQzFCLGtEQUEwQjtBQUUxQiwrQ0FBK0M7QUFFL0MsaUNBQXNDO0FBRXRDLE1BQU0sV0FBVyxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUMsWUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQ2pELE1BQU0sV0FBVyxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUMsWUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQ2hELE1BQU0sUUFBUSxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUMsZUFBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQzFDLE1BQU0sY0FBYyxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUMsWUFBRSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0FBQ3RELE1BQU0sZUFBZSxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUMsWUFBRSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0FBQ3hELE1BQU0sY0FBYyxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUMsWUFBRSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0FBQ3RELE1BQU0sVUFBVSxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBRTlDLGVBQUssQ0FBQyxPQUFPLENBQ1gsWUFBRSxFQUNGLFdBQVcsRUFDWCxlQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUNqQixXQUFXLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSTtJQUN2QixNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSTtDQUNuQixDQUFDLENBQ0gsQ0FBQztBQUVGLE1BQU0sWUFBWSxHQUFHOzs7Ozs7Ozs7Ozs7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