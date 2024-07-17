"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTokens = exports.balance = exports.init = void 0;
const encoding_1 = require("@cosmjs/encoding");
// creates it with 6 decimal places
// '123456789000'
function init(owner, symbol, amount) {
    return {
        decimals: 6,
        name: symbol,
        symbol,
        initial_balances: [
            {
                address: owner,
                amount,
            },
        ],
    };
}
exports.init = init;
async function balance(cosmwasm, cw20Addr, senderAddress) {
    const query = {
        balance: {
            address: senderAddress || cosmwasm.senderAddress,
        },
    };
    const res = await cosmwasm.sign.queryContractSmart(cw20Addr, query);
    // print this
    return res.balance;
}
exports.balance = balance;
function sendTokens(targetAddr, amount, msg) {
    const encoded = (0, encoding_1.toBase64)((0, encoding_1.toUtf8)(JSON.stringify(msg)));
    const sendMsg = {
        send: {
            contract: targetAddr,
            amount,
            msg: encoded,
        },
    };
    return sendMsg;
}
exports.sendTokens = sendTokens;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3cyMC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jdzIwL2N3MjAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0NBQW9EO0FBSXBELG1DQUFtQztBQUNuQyxpQkFBaUI7QUFDakIsU0FBZ0IsSUFBSSxDQUNsQixLQUFhLEVBQ2IsTUFBYyxFQUNkLE1BQWM7SUFFZCxPQUFPO1FBQ0wsUUFBUSxFQUFFLENBQUM7UUFDWCxJQUFJLEVBQUUsTUFBTTtRQUNaLE1BQU07UUFDTixnQkFBZ0IsRUFBRTtZQUNoQjtnQkFDRSxPQUFPLEVBQUUsS0FBSztnQkFDZCxNQUFNO2FBQ1A7U0FDRjtLQUNGLENBQUM7QUFDSixDQUFDO0FBaEJELG9CQWdCQztBQUVNLEtBQUssVUFBVSxPQUFPLENBQzNCLFFBQXdCLEVBQ3hCLFFBQWdCLEVBQ2hCLGFBQXNCO0lBRXRCLE1BQU0sS0FBSyxHQUFHO1FBQ1osT0FBTyxFQUFFO1lBQ1AsT0FBTyxFQUFFLGFBQWEsSUFBSSxRQUFRLENBQUMsYUFBYTtTQUNqRDtLQUNGLENBQUM7SUFDRixNQUFNLEdBQUcsR0FBRyxNQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3BFLGFBQWE7SUFDYixPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUM7QUFDckIsQ0FBQztBQWJELDBCQWFDO0FBRUQsU0FBZ0IsVUFBVSxDQUN4QixVQUFrQixFQUNsQixNQUFjLEVBQ2QsR0FBNEI7SUFFNUIsTUFBTSxPQUFPLEdBQUcsSUFBQSxtQkFBUSxFQUFDLElBQUEsaUJBQU0sRUFBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0RCxNQUFNLE9BQU8sR0FBRztRQUNkLElBQUksRUFBRTtZQUNKLFFBQVEsRUFBRSxVQUFVO1lBQ3BCLE1BQU07WUFDTixHQUFHLEVBQUUsT0FBTztTQUNiO0tBQ0YsQ0FBQztJQUNGLE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7QUFkRCxnQ0FjQyJ9