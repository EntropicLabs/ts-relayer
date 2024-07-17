"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const encoding_1 = require("@cosmjs/encoding");
const tendermint_rpc_1 = require("@cosmjs/tendermint-rpc");
const ava_1 = __importDefault(require("ava"));
const utils_1 = require("./utils");
(0, ava_1.default)("parsePacketsFromEvents", (t) => {
    // From https://gist.github.com/webmaster128/14d273b3b462c1c653f51e3e1edb8cd5
    const events = [
        {
            type: "coin_spent",
            attributes: [
                {
                    key: (0, encoding_1.fromBase64)("c3BlbmRlcg=="),
                    value: (0, encoding_1.fromBase64)("anVubzEwMHM0NXM0aDk0cWRrY2FmbW1ycWZsdGxyZ3lxd3luNmUwNWp4Mg=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("YW1vdW50"),
                    value: (0, encoding_1.fromBase64)("MzY5NDV1anVub3g="),
                },
            ],
        },
        {
            type: "coin_received",
            attributes: [
                {
                    key: (0, encoding_1.fromBase64)("cmVjZWl2ZXI="),
                    value: (0, encoding_1.fromBase64)("anVubzE3eHBmdmFrbTJhbWc5NjJ5bHM2Zjg0ejNrZWxsOGM1bHh0cW12cA=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("YW1vdW50"),
                    value: (0, encoding_1.fromBase64)("MzY5NDV1anVub3g="),
                },
            ],
        },
        {
            type: "transfer",
            attributes: [
                {
                    key: (0, encoding_1.fromBase64)("cmVjaXBpZW50"),
                    value: (0, encoding_1.fromBase64)("anVubzE3eHBmdmFrbTJhbWc5NjJ5bHM2Zjg0ejNrZWxsOGM1bHh0cW12cA=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("c2VuZGVy"),
                    value: (0, encoding_1.fromBase64)("anVubzEwMHM0NXM0aDk0cWRrY2FmbW1ycWZsdGxyZ3lxd3luNmUwNWp4Mg=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("YW1vdW50"),
                    value: (0, encoding_1.fromBase64)("MzY5NDV1anVub3g="),
                },
            ],
        },
        {
            type: "message",
            attributes: [
                {
                    key: (0, encoding_1.fromBase64)("c2VuZGVy"),
                    value: (0, encoding_1.fromBase64)("anVubzEwMHM0NXM0aDk0cWRrY2FmbW1ycWZsdGxyZ3lxd3luNmUwNWp4Mg=="),
                },
            ],
        },
        {
            type: "tx",
            attributes: [
                {
                    key: (0, encoding_1.fromBase64)("ZmVl"),
                    value: (0, encoding_1.fromBase64)("MzY5NDV1anVub3g="),
                },
            ],
        },
        {
            type: "tx",
            attributes: [
                {
                    key: (0, encoding_1.fromBase64)("YWNjX3NlcQ=="),
                    value: (0, encoding_1.fromBase64)("anVubzEwMHM0NXM0aDk0cWRrY2FmbW1ycWZsdGxyZ3lxd3luNmUwNWp4Mi8xMjQ5Mg=="),
                },
            ],
        },
        {
            type: "tx",
            attributes: [
                {
                    key: (0, encoding_1.fromBase64)("c2lnbmF0dXJl"),
                    value: (0, encoding_1.fromBase64)("Sm42eW9WYlFPdFIxWlNHRW1lQmQ4c2VaOTl5RHlqdlJ2eU8rR1hGL1FGaDh3bzR2Tm5EckFFUzNxNmk0Sy9XTnhhdkNFRDAxVXNSK0hJYVB2djdRNkE9PQ=="),
                },
            ],
        },
        {
            type: "message",
            attributes: [
                {
                    key: (0, encoding_1.fromBase64)("YWN0aW9u"),
                    value: (0, encoding_1.fromBase64)("L2Nvc213YXNtLndhc20udjEuTXNnRXhlY3V0ZUNvbnRyYWN0"),
                },
            ],
        },
        {
            type: "message",
            attributes: [
                {
                    key: (0, encoding_1.fromBase64)("bW9kdWxl"),
                    value: (0, encoding_1.fromBase64)("d2FzbQ=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("c2VuZGVy"),
                    value: (0, encoding_1.fromBase64)("anVubzEwMHM0NXM0aDk0cWRrY2FmbW1ycWZsdGxyZ3lxd3luNmUwNWp4Mg=="),
                },
            ],
        },
        {
            type: "execute",
            attributes: [
                {
                    key: (0, encoding_1.fromBase64)("X2NvbnRyYWN0X2FkZHJlc3M="),
                    value: (0, encoding_1.fromBase64)("anVubzE0eWYyNHBmY3pjc2xjaGRyMDR1NXAyeXc5enhmNmN2czN2aGU5cjlzcmY1cGc2eTJwN25xZHFuN2tu"),
                },
            ],
        },
        {
            type: "execute",
            attributes: [
                {
                    key: (0, encoding_1.fromBase64)("X2NvbnRyYWN0X2FkZHJlc3M="),
                    value: (0, encoding_1.fromBase64)("anVubzFlN3ZzNzZtYXJrc2h1czM5ZXlmZWZoMnkzdDlndWdlNHQwa3ZxeWEzcTZ2YW1nc2VqaDRxOGx4dHE5"),
                },
            ],
        },
        {
            type: "wasm",
            attributes: [
                {
                    key: (0, encoding_1.fromBase64)("X2NvbnRyYWN0X2FkZHJlc3M="),
                    value: (0, encoding_1.fromBase64)("anVubzFlN3ZzNzZtYXJrc2h1czM5ZXlmZWZoMnkzdDlndWdlNHQwa3ZxeWEzcTZ2YW1nc2VqaDRxOGx4dHE5"),
                },
                {
                    key: (0, encoding_1.fromBase64)("YWN0aW9u"),
                    value: (0, encoding_1.fromBase64)("ZXhlY3V0ZV9nZXRfbmV4dF9yYW5kb21uZXNz"),
                },
            ],
        },
        {
            type: "send_packet",
            attributes: [
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X2NoYW5uZWxfb3JkZXJpbmc="),
                    value: (0, encoding_1.fromBase64)("T1JERVJfVU5PUkRFUkVE"),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X2Nvbm5lY3Rpb24="),
                    value: (0, encoding_1.fromBase64)("Y29ubmVjdGlvbi0zMQ=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X2RhdGE="),
                    value: (0, encoding_1.fromBase64)("eyJhZnRlciI6IjE2NjYxNjkwMDM0MTM1NzgyNjkiLCJzZW5kZXIiOiJqdW5vMTR5ZjI0cGZjemNzbGNoZHIwNHU1cDJ5dzl6eGY2Y3ZzM3ZoZTlyOXNyZjVwZzZ5MnA3bnFkcW43a24iLCJqb2JfaWQiOiJzaW1vbi1yb2xsLTEifQ=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X2RhdGFfaGV4"),
                    value: (0, encoding_1.fromBase64)("N2IyMjYxNjY3NDY1NzIyMjNhMjIzMTM2MzYzNjMxMzYzOTMwMzAzMzM0MzEzMzM1MzczODMyMzYzOTIyMmMyMjczNjU2ZTY0NjU3MjIyM2EyMjZhNzU2ZTZmMzEzNDc5NjYzMjM0NzA2NjYzN2E2MzczNmM2MzY4NjQ3MjMwMzQ3NTM1NzAzMjc5NzczOTdhNzg2NjM2NjM3NjczMzM3NjY4NjUzOTcyMzk3MzcyNjYzNTcwNjczNjc5MzI3MDM3NmU3MTY0NzE2ZTM3NmI2ZTIyMmMyMjZhNmY2MjVmNjk2NDIyM2EyMjczNjk2ZDZmNmUyZDcyNmY2YzZjMmQzMTIyN2Q="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X2RzdF9jaGFubmVs"),
                    value: (0, encoding_1.fromBase64)("Y2hhbm5lbC0xMA=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X2RzdF9wb3J0"),
                    value: (0, encoding_1.fromBase64)("d2FzbS5ub2lzMWo3bTRmNjhscnVjZWc1eHEzZ2ZrZmRnZGd6MDJ2aHZscTJwNjd2Zjl2M2h3ZHlkYWF0M3NhanpjeTU="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X3NlcXVlbmNl"),
                    value: (0, encoding_1.fromBase64)("NzUyNA=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X3NyY19jaGFubmVs"),
                    value: (0, encoding_1.fromBase64)("Y2hhbm5lbC00Mg=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X3NyY19wb3J0"),
                    value: (0, encoding_1.fromBase64)("d2FzbS5qdW5vMWU3dnM3Nm1hcmtzaHVzMzlleWZlZmgyeTN0OWd1Z2U0dDBrdnF5YTNxNnZhbWdzZWpoNHE4bHh0cTk="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X3RpbWVvdXRfaGVpZ2h0"),
                    value: (0, encoding_1.fromBase64)("MC0w"),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X3RpbWVvdXRfdGltZXN0YW1w"),
                    value: (0, encoding_1.fromBase64)("MTY2NjE3MjYwMDQxMzU3ODI2OQ=="),
                },
            ],
        },
        {
            type: "execute",
            attributes: [
                {
                    key: (0, encoding_1.fromBase64)("X2NvbnRyYWN0X2FkZHJlc3M="),
                    value: (0, encoding_1.fromBase64)("anVubzFlN3ZzNzZtYXJrc2h1czM5ZXlmZWZoMnkzdDlndWdlNHQwa3ZxeWEzcTZ2YW1nc2VqaDRxOGx4dHE5"),
                },
            ],
        },
        {
            type: "wasm",
            attributes: [
                {
                    key: (0, encoding_1.fromBase64)("X2NvbnRyYWN0X2FkZHJlc3M="),
                    value: (0, encoding_1.fromBase64)("anVubzFlN3ZzNzZtYXJrc2h1czM5ZXlmZWZoMnkzdDlndWdlNHQwa3ZxeWEzcTZ2YW1nc2VqaDRxOGx4dHE5"),
                },
                {
                    key: (0, encoding_1.fromBase64)("YWN0aW9u"),
                    value: (0, encoding_1.fromBase64)("ZXhlY3V0ZV9nZXRfbmV4dF9yYW5kb21uZXNz"),
                },
            ],
        },
        {
            type: "send_packet",
            attributes: [
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X2NoYW5uZWxfb3JkZXJpbmc="),
                    value: (0, encoding_1.fromBase64)("T1JERVJfVU5PUkRFUkVE"),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X2Nvbm5lY3Rpb24="),
                    value: (0, encoding_1.fromBase64)("Y29ubmVjdGlvbi0zMQ=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X2RhdGE="),
                    value: (0, encoding_1.fromBase64)("eyJhZnRlciI6IjE2NjYxNjkwMDM0MTM1NzgyNjkiLCJzZW5kZXIiOiJqdW5vMTR5ZjI0cGZjemNzbGNoZHIwNHU1cDJ5dzl6eGY2Y3ZzM3ZoZTlyOXNyZjVwZzZ5MnA3bnFkcW43a24iLCJqb2JfaWQiOiJzaW1vbi1yb2xsLTIifQ=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X2RhdGFfaGV4"),
                    value: (0, encoding_1.fromBase64)("N2IyMjYxNjY3NDY1NzIyMjNhMjIzMTM2MzYzNjMxMzYzOTMwMzAzMzM0MzEzMzM1MzczODMyMzYzOTIyMmMyMjczNjU2ZTY0NjU3MjIyM2EyMjZhNzU2ZTZmMzEzNDc5NjYzMjM0NzA2NjYzN2E2MzczNmM2MzY4NjQ3MjMwMzQ3NTM1NzAzMjc5NzczOTdhNzg2NjM2NjM3NjczMzM3NjY4NjUzOTcyMzk3MzcyNjYzNTcwNjczNjc5MzI3MDM3NmU3MTY0NzE2ZTM3NmI2ZTIyMmMyMjZhNmY2MjVmNjk2NDIyM2EyMjczNjk2ZDZmNmUyZDcyNmY2YzZjMmQzMjIyN2Q="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X2RzdF9jaGFubmVs"),
                    value: (0, encoding_1.fromBase64)("Y2hhbm5lbC0xMA=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X2RzdF9wb3J0"),
                    value: (0, encoding_1.fromBase64)("d2FzbS5ub2lzMWo3bTRmNjhscnVjZWc1eHEzZ2ZrZmRnZGd6MDJ2aHZscTJwNjd2Zjl2M2h3ZHlkYWF0M3NhanpjeTU="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X3NlcXVlbmNl"),
                    value: (0, encoding_1.fromBase64)("NzUyNQ=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X3NyY19jaGFubmVs"),
                    value: (0, encoding_1.fromBase64)("Y2hhbm5lbC00Mg=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X3NyY19wb3J0"),
                    value: (0, encoding_1.fromBase64)("d2FzbS5qdW5vMWU3dnM3Nm1hcmtzaHVzMzlleWZlZmgyeTN0OWd1Z2U0dDBrdnF5YTNxNnZhbWdzZWpoNHE4bHh0cTk="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X3RpbWVvdXRfaGVpZ2h0"),
                    value: (0, encoding_1.fromBase64)("MC0w"),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X3RpbWVvdXRfdGltZXN0YW1w"),
                    value: (0, encoding_1.fromBase64)("MTY2NjE3MjYwMDQxMzU3ODI2OQ=="),
                },
            ],
        },
        {
            type: "execute",
            attributes: [
                {
                    key: (0, encoding_1.fromBase64)("X2NvbnRyYWN0X2FkZHJlc3M="),
                    value: (0, encoding_1.fromBase64)("anVubzFlN3ZzNzZtYXJrc2h1czM5ZXlmZWZoMnkzdDlndWdlNHQwa3ZxeWEzcTZ2YW1nc2VqaDRxOGx4dHE5"),
                },
            ],
        },
        {
            type: "wasm",
            attributes: [
                {
                    key: (0, encoding_1.fromBase64)("X2NvbnRyYWN0X2FkZHJlc3M="),
                    value: (0, encoding_1.fromBase64)("anVubzFlN3ZzNzZtYXJrc2h1czM5ZXlmZWZoMnkzdDlndWdlNHQwa3ZxeWEzcTZ2YW1nc2VqaDRxOGx4dHE5"),
                },
                {
                    key: (0, encoding_1.fromBase64)("YWN0aW9u"),
                    value: (0, encoding_1.fromBase64)("ZXhlY3V0ZV9nZXRfbmV4dF9yYW5kb21uZXNz"),
                },
            ],
        },
        {
            type: "send_packet",
            attributes: [
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X2NoYW5uZWxfb3JkZXJpbmc="),
                    value: (0, encoding_1.fromBase64)("T1JERVJfVU5PUkRFUkVE"),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X2Nvbm5lY3Rpb24="),
                    value: (0, encoding_1.fromBase64)("Y29ubmVjdGlvbi0zMQ=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X2RhdGE="),
                    value: (0, encoding_1.fromBase64)("eyJhZnRlciI6IjE2NjYxNjkwMDM0MTM1NzgyNjkiLCJzZW5kZXIiOiJqdW5vMTR5ZjI0cGZjemNzbGNoZHIwNHU1cDJ5dzl6eGY2Y3ZzM3ZoZTlyOXNyZjVwZzZ5MnA3bnFkcW43a24iLCJqb2JfaWQiOiJzaW1vbi1yb2xsLTMifQ=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X2RhdGFfaGV4"),
                    value: (0, encoding_1.fromBase64)("N2IyMjYxNjY3NDY1NzIyMjNhMjIzMTM2MzYzNjMxMzYzOTMwMzAzMzM0MzEzMzM1MzczODMyMzYzOTIyMmMyMjczNjU2ZTY0NjU3MjIyM2EyMjZhNzU2ZTZmMzEzNDc5NjYzMjM0NzA2NjYzN2E2MzczNmM2MzY4NjQ3MjMwMzQ3NTM1NzAzMjc5NzczOTdhNzg2NjM2NjM3NjczMzM3NjY4NjUzOTcyMzk3MzcyNjYzNTcwNjczNjc5MzI3MDM3NmU3MTY0NzE2ZTM3NmI2ZTIyMmMyMjZhNmY2MjVmNjk2NDIyM2EyMjczNjk2ZDZmNmUyZDcyNmY2YzZjMmQzMzIyN2Q="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X2RzdF9jaGFubmVs"),
                    value: (0, encoding_1.fromBase64)("Y2hhbm5lbC0xMA=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X2RzdF9wb3J0"),
                    value: (0, encoding_1.fromBase64)("d2FzbS5ub2lzMWo3bTRmNjhscnVjZWc1eHEzZ2ZrZmRnZGd6MDJ2aHZscTJwNjd2Zjl2M2h3ZHlkYWF0M3NhanpjeTU="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X3NlcXVlbmNl"),
                    value: (0, encoding_1.fromBase64)("NzUyNg=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X3NyY19jaGFubmVs"),
                    value: (0, encoding_1.fromBase64)("Y2hhbm5lbC00Mg=="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X3NyY19wb3J0"),
                    value: (0, encoding_1.fromBase64)("d2FzbS5qdW5vMWU3dnM3Nm1hcmtzaHVzMzlleWZlZmgyeTN0OWd1Z2U0dDBrdnF5YTNxNnZhbWdzZWpoNHE4bHh0cTk="),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X3RpbWVvdXRfaGVpZ2h0"),
                    value: (0, encoding_1.fromBase64)("MC0w"),
                },
                {
                    key: (0, encoding_1.fromBase64)("cGFja2V0X3RpbWVvdXRfdGltZXN0YW1w"),
                    value: (0, encoding_1.fromBase64)("MTY2NjE3MjYwMDQxMzU3ODI2OQ=="),
                },
            ],
        },
    ];
    // See https://testnet.mintscan.io/juno-testnet/txs/F64B8C6A320A9C25FD1EA60B00194817B069C9CBEF19B736117D9339F33F2E51
    // for packet logs
    const packets = (0, utils_1.parsePacketsFromTendermintEvents)(events);
    t.is(packets.length, 3);
    const [packet0, packet1, packet2] = packets;
    t.deepEqual(packet0, {
        sequence: BigInt(7524),
        sourcePort: "wasm.juno1e7vs76markshus39eyfefh2y3t9guge4t0kvqya3q6vamgsejh4q8lxtq9",
        sourceChannel: "channel-42",
        destinationPort: "wasm.nois1j7m4f68lruceg5xq3gfkfdgdgz02vhvlq2p67vf9v3hwdydaat3sajzcy5",
        destinationChannel: "channel-10",
        data: (0, encoding_1.fromHex)("7b226166746572223a2231363636313639303033343133353738323639222c2273656e646572223a226a756e6f3134796632347066637a63736c636864723034753570327977397a7866366376733376686539723973726635706736793270376e7164716e376b6e222c226a6f625f6964223a2273696d6f6e2d726f6c6c2d31227d"),
        timeoutHeight: {
            revisionHeight: BigInt("0"),
            revisionNumber: BigInt("0"),
        },
        timeoutTimestamp: BigInt("1666172600413578269"),
    });
    t.deepEqual(packet1, {
        sequence: BigInt(7525),
        sourcePort: "wasm.juno1e7vs76markshus39eyfefh2y3t9guge4t0kvqya3q6vamgsejh4q8lxtq9",
        sourceChannel: "channel-42",
        destinationPort: "wasm.nois1j7m4f68lruceg5xq3gfkfdgdgz02vhvlq2p67vf9v3hwdydaat3sajzcy5",
        destinationChannel: "channel-10",
        data: (0, encoding_1.fromHex)("7b226166746572223a2231363636313639303033343133353738323639222c2273656e646572223a226a756e6f3134796632347066637a63736c636864723034753570327977397a7866366376733376686539723973726635706736793270376e7164716e376b6e222c226a6f625f6964223a2273696d6f6e2d726f6c6c2d32227d"),
        timeoutHeight: {
            revisionHeight: BigInt("0"),
            revisionNumber: BigInt("0"),
        },
        timeoutTimestamp: BigInt("1666172600413578269"),
    });
    t.deepEqual(packet2, {
        sequence: BigInt(7526),
        sourcePort: "wasm.juno1e7vs76markshus39eyfefh2y3t9guge4t0kvqya3q6vamgsejh4q8lxtq9",
        sourceChannel: "channel-42",
        destinationPort: "wasm.nois1j7m4f68lruceg5xq3gfkfdgdgz02vhvlq2p67vf9v3hwdydaat3sajzcy5",
        destinationChannel: "channel-10",
        data: (0, encoding_1.fromHex)("7b226166746572223a2231363636313639303033343133353738323639222c2273656e646572223a226a756e6f3134796632347066637a63736c636864723034753570327977397a7866366376733376686539723973726635706736793270376e7164716e376b6e222c226a6f625f6964223a2273696d6f6e2d726f6c6c2d33227d"),
        timeoutHeight: {
            revisionHeight: BigInt("0"),
            revisionNumber: BigInt("0"),
        },
        timeoutTimestamp: BigInt("1666172600413578269"),
    });
});
(0, ava_1.default)("parsePacketsFromTxEvents works for one packet", (t) => {
    // curl -sS "https://juno-testnet-rpc.polkachu.com/tx?hash=0x502E6F4AEA3FB185DD894D0DC14E013C45E6F52AC00A0B5224F6876A1CA107DB" | jq .result.tx_result.log -r
    // and then replace \" with \\" to get the correct JavaScript escaping
    const events = JSON.parse('[{"type":"execute","attributes":[{"key":"_contract_address","value":"juno19pam0vncl2s3etn4e7rqxvpq2gkyu9wg2czfvsph6dgvp00fsrxqzjt5sr"},{"key":"_contract_address","value":"juno1e7vs76markshus39eyfefh2y3t9guge4t0kvqya3q6vamgsejh4q8lxtq9"}]},{"type":"message","attributes":[{"key":"action","value":"/cosmwasm.wasm.v1.MsgExecuteContract"},{"key":"module","value":"wasm"},{"key":"sender","value":"juno100s45s4h94qdkcafmmrqfltlrgyqwyn6e05jx2"}]},{"type":"send_packet","attributes":[{"key":"packet_channel_ordering","value":"ORDER_UNORDERED"},{"key":"packet_connection","value":"connection-31"},{"key":"packet_data","value":"{\\"after\\":\\"1666164035856871113\\",\\"sender\\":\\"juno19pam0vncl2s3etn4e7rqxvpq2gkyu9wg2czfvsph6dgvp00fsrxqzjt5sr\\",\\"job_id\\":\\"dapp-1-1666164017\\"}"},{"key":"packet_data_hex","value":"7b226166746572223a2231363636313634303335383536383731313133222c2273656e646572223a226a756e6f313970616d30766e636c32733365746e34653772717876707132676b797539776732637a66767370683664677670303066737278717a6a74357372222c226a6f625f6964223a22646170702d312d31363636313634303137227d"},{"key":"packet_dst_channel","value":"channel-10"},{"key":"packet_dst_port","value":"wasm.nois1j7m4f68lruceg5xq3gfkfdgdgz02vhvlq2p67vf9v3hwdydaat3sajzcy5"},{"key":"packet_sequence","value":"7489"},{"key":"packet_src_channel","value":"channel-42"},{"key":"packet_src_port","value":"wasm.juno1e7vs76markshus39eyfefh2y3t9guge4t0kvqya3q6vamgsejh4q8lxtq9"},{"key":"packet_timeout_height","value":"0-0"},{"key":"packet_timeout_timestamp","value":"1666167632856871113"}]},{"type":"wasm","attributes":[{"key":"_contract_address","value":"juno1e7vs76markshus39eyfefh2y3t9guge4t0kvqya3q6vamgsejh4q8lxtq9"},{"key":"action","value":"execute_get_next_randomness"}]}]');
    const packets = (0, utils_1.parsePacketsFromEvents)(events);
    t.is(packets.length, 1);
    t.deepEqual(packets[0], {
        sequence: BigInt(7489),
        sourcePort: "wasm.juno1e7vs76markshus39eyfefh2y3t9guge4t0kvqya3q6vamgsejh4q8lxtq9",
        sourceChannel: "channel-42",
        destinationPort: "wasm.nois1j7m4f68lruceg5xq3gfkfdgdgz02vhvlq2p67vf9v3hwdydaat3sajzcy5",
        destinationChannel: "channel-10",
        data: (0, encoding_1.fromHex)("7b226166746572223a2231363636313634303335383536383731313133222c2273656e646572223a226a756e6f313970616d30766e636c32733365746e34653772717876707132676b797539776732637a66767370683664677670303066737278717a6a74357372222c226a6f625f6964223a22646170702d312d31363636313634303137227d"),
        timeoutHeight: {
            revisionHeight: BigInt("0"),
            revisionNumber: BigInt("0"),
        },
        timeoutTimestamp: BigInt("1666167632856871113"),
    });
});
(0, ava_1.default)("can parse revision numbers", (t) => {
    const musselnet = (0, utils_1.parseRevisionNumber)("musselnet-4");
    t.is(musselnet, 4n);
    const numerific = (0, utils_1.parseRevisionNumber)("numers-123-456");
    t.is(numerific, 456n);
    const nonums = (0, utils_1.parseRevisionNumber)("hello");
    t.is(nonums, 0n);
    const nonums2 = (0, utils_1.parseRevisionNumber)("hello-world");
    t.is(nonums2, 0n);
});
(0, ava_1.default)("can parse strange revision numbers", (t) => {
    // all of these should give 0
    const strangers = [
        "",
        "-",
        "hello-",
        "hello-123-",
        "hello-0123",
        "hello-00123",
        "hello-1.23",
    ];
    for (const strange of strangers) {
        const rev = (0, utils_1.parseRevisionNumber)(strange);
        t.is(rev, 0n, strange);
    }
});
function nanosFromDateTime(time) {
    const stamp = (0, utils_1.timestampFromDateNanos)(time);
    return stamp.seconds * 1000000000n + BigInt(stamp.nanos);
}
(0, ava_1.default)("time-based timeouts properly", (t) => {
    const time1 = (0, tendermint_rpc_1.fromRfc3339WithNanoseconds)("2021-03-12T12:34:56.123456789Z");
    const time2 = (0, tendermint_rpc_1.fromRfc3339WithNanoseconds)("2021-03-12T12:36:56.543543543Z");
    const time3 = (0, tendermint_rpc_1.fromRfc3339WithNanoseconds)("2021-03-12T12:36:13Z");
    const sec1 = (0, utils_1.secondsFromDateNanos)(time1);
    const nanos1 = nanosFromDateTime(time1);
    const sec2 = (0, utils_1.secondsFromDateNanos)(time2);
    const nanos2 = nanosFromDateTime(time2);
    const greaterThanNull = (0, utils_1.timeGreater)(undefined, (0, utils_1.secondsFromDateNanos)(time1));
    t.is(greaterThanNull, true);
    const greaterThanPast = (0, utils_1.timeGreater)(nanos2, sec1);
    t.is(greaterThanPast, true);
    const greaterThanFuture = (0, utils_1.timeGreater)(nanos1, sec2);
    t.is(greaterThanFuture, false);
    // nanos seconds beat seconds if present
    const greaterThanSelfWithNanos = (0, utils_1.timeGreater)(nanos1, sec1);
    t.is(greaterThanSelfWithNanos, true);
    const greaterThanSelf = (0, utils_1.timeGreater)(nanosFromDateTime(time3), (0, utils_1.secondsFromDateNanos)(time3));
    t.is(greaterThanSelf, false);
});
(0, ava_1.default)("height based timeouts properly", (t) => {
    const height1a = {
        revisionHeight: BigInt(12345),
        revisionNumber: BigInt(1),
    };
    const height1b = {
        revisionHeight: BigInt(14000),
        revisionNumber: BigInt(1),
    };
    const height2a = {
        revisionHeight: BigInt(600),
        revisionNumber: BigInt(2),
    };
    t.assert((0, utils_1.heightGreater)(height1b, height1a));
    t.assert((0, utils_1.heightGreater)(height2a, height1b));
    t.assert((0, utils_1.heightGreater)(undefined, height2a));
    t.false((0, utils_1.heightGreater)(height1b, height1b));
    t.false((0, utils_1.heightGreater)(height1a, height1b));
});
(0, ava_1.default)("Properly determines height-based timeouts", (t) => {
    // proper heights
    t.deepEqual((0, utils_1.parseHeightAttribute)("1-34"), {
        revisionNumber: BigInt(1),
        revisionHeight: BigInt(34),
    });
    t.deepEqual((0, utils_1.parseHeightAttribute)("17-3456"), {
        revisionNumber: BigInt(17),
        revisionHeight: BigInt(3456),
    });
    // handles revision number 0 properly (this is allowed)
    t.deepEqual((0, utils_1.parseHeightAttribute)("0-1724"), {
        revisionNumber: BigInt(0),
        revisionHeight: BigInt(1724),
    });
    // missing heights
    t.is((0, utils_1.parseHeightAttribute)(""), undefined);
    t.is((0, utils_1.parseHeightAttribute)(), undefined);
    // bad format
    t.is((0, utils_1.parseHeightAttribute)("some-random-string"), undefined);
    // zero value is defined as missing
    t.is((0, utils_1.parseHeightAttribute)("0-0"), undefined);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvdXRpbHMuc3BlYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLCtDQUF1RDtBQUN2RCwyREFJZ0M7QUFDaEMsOENBQXVCO0FBRXZCLG1DQVNpQjtBQUVqQixJQUFBLGFBQUksRUFBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO0lBQ25DLDZFQUE2RTtJQUM3RSxNQUFNLE1BQU0sR0FBeUI7UUFDbkM7WUFDRSxJQUFJLEVBQUUsWUFBWTtZQUNsQixVQUFVLEVBQUU7Z0JBQ1Y7b0JBQ0UsR0FBRyxFQUFFLElBQUEscUJBQVUsRUFBQyxjQUFjLENBQUM7b0JBQy9CLEtBQUssRUFBRSxJQUFBLHFCQUFVLEVBQ2YsOERBQThELENBQy9EO2lCQUNGO2dCQUNEO29CQUNFLEdBQUcsRUFBRSxJQUFBLHFCQUFVLEVBQUMsVUFBVSxDQUFDO29CQUMzQixLQUFLLEVBQUUsSUFBQSxxQkFBVSxFQUFDLGtCQUFrQixDQUFDO2lCQUN0QzthQUNGO1NBQ0Y7UUFDRDtZQUNFLElBQUksRUFBRSxlQUFlO1lBQ3JCLFVBQVUsRUFBRTtnQkFDVjtvQkFDRSxHQUFHLEVBQUUsSUFBQSxxQkFBVSxFQUFDLGNBQWMsQ0FBQztvQkFDL0IsS0FBSyxFQUFFLElBQUEscUJBQVUsRUFDZiw4REFBOEQsQ0FDL0Q7aUJBQ0Y7Z0JBQ0Q7b0JBQ0UsR0FBRyxFQUFFLElBQUEscUJBQVUsRUFBQyxVQUFVLENBQUM7b0JBQzNCLEtBQUssRUFBRSxJQUFBLHFCQUFVLEVBQUMsa0JBQWtCLENBQUM7aUJBQ3RDO2FBQ0Y7U0FDRjtRQUNEO1lBQ0UsSUFBSSxFQUFFLFVBQVU7WUFDaEIsVUFBVSxFQUFFO2dCQUNWO29CQUNFLEdBQUcsRUFBRSxJQUFBLHFCQUFVLEVBQUMsY0FBYyxDQUFDO29CQUMvQixLQUFLLEVBQUUsSUFBQSxxQkFBVSxFQUNmLDhEQUE4RCxDQUMvRDtp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