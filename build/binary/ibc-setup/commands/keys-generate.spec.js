"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const ava_1 = __importDefault(require("ava"));
const sinon_1 = __importDefault(require("sinon"));
const keys_generate_1 = require("./keys-generate");
const fsWriteFileSync = sinon_1.default.stub(fs_1.default, "writeFileSync");
const consoleLog = sinon_1.default.stub(console, "log");
ava_1.default.beforeEach(() => {
    sinon_1.default.reset();
    fsWriteFileSync.returns();
});
(0, ava_1.default)("generates mnemonic to stdout", (t) => {
    const options = {
        keyFile: null,
    };
    (0, keys_generate_1.run)(options);
    t.assert(consoleLog.calledOnce);
    t.assert(consoleLog.calledWithMatch(/[\\w ]+/));
    t.assert(fsWriteFileSync.notCalled);
});
(0, ava_1.default)("generates mnemonic to file", (t) => {
    const options = {
        keyFile: "/home/user/mnemonic.txt",
    };
    (0, keys_generate_1.run)(options);
    const [path, contents] = fsWriteFileSync.getCall(0).args;
    t.is(path, options.keyFile ?? "");
    t.regex(contents, /[\\w ]+/);
    t.assert(consoleLog.calledOnce);
    t.assert(consoleLog.calledWithMatch(/Saved mnemonic to/));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5cy1nZW5lcmF0ZS5zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2JpbmFyeS9pYmMtc2V0dXAvY29tbWFuZHMva2V5cy1nZW5lcmF0ZS5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsNENBQW9CO0FBRXBCLDhDQUF1QjtBQUN2QixrREFBMEI7QUFFMUIsbURBQStDO0FBRS9DLE1BQU0sZUFBZSxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUMsWUFBRSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0FBQ3hELE1BQU0sVUFBVSxHQUFHLGVBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBRTlDLGFBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFO0lBQ25CLGVBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUVkLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUM1QixDQUFDLENBQUMsQ0FBQztBQUVILElBQUEsYUFBSSxFQUFDLDhCQUE4QixFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7SUFDekMsTUFBTSxPQUFPLEdBQVk7UUFDdkIsT0FBTyxFQUFFLElBQUk7S0FDZCxDQUFDO0lBRUYsSUFBQSxtQkFBRyxFQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRWIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDaEMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDaEQsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDdEMsQ0FBQyxDQUFDLENBQUM7QUFFSCxJQUFBLGFBQUksRUFBQyw0QkFBNEIsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO0lBQ3ZDLE1BQU0sT0FBTyxHQUFZO1FBQ3ZCLE9BQU8sRUFBRSx5QkFBeUI7S0FDbkMsQ0FBQztJQUVGLElBQUEsbUJBQUcsRUFBQyxPQUFPLENBQUMsQ0FBQztJQUViLE1BQU0sQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLEdBQUcsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDekQsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsQ0FBQztJQUNsQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQWtCLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFFdkMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDaEMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztBQUM1RCxDQUFDLENBQUMsQ0FBQyJ9