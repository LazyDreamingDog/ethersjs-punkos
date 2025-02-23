"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import assert from "assert";
//import Web3HttpProvider from "web3-providers-http";
import { ethers } from "ethers";
import { fundAddress, returnFunds } from "./utils";
const bnify = ethers.BigNumber.from;
const blockchainData = {
    punkos: {
        addresses: [
            {
                address: "0xf61bdf96dc06685065337b76659bebac9cbb53bb",
                balance: bnify("1000000000000000000000000000"),
                interest: bnify("0"),
                code: "0x"
            },
        ],
        blocks: [
            {
                hash: "0x11d50cde9e5bbe2cd253359b5a94b0ccdd6aac161997621d469d3b2deac4f778",
                parentHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
                number: 0,
                timestamp: 0,
                difficulty: 1,
                gasLimit: bnify("8000000"),
                gasUsed: bnify("0"),
                miner: "0x0000000000000000000000000000000000000000",
                extraData: "0x0000000000000000000000000000000000000000000000000000000000000000b0725bdd29091782aadd05d693370408f46174db0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                transactions: []
            },
        ],
        transactions: [],
        transactionReceipts: [
            {
                blockHash: "0x2384e8e8bdcf6eb87ec7c138fa503ac34adb32cac817e4b35f14d4339eaa1993",
                blockNumber: 47464,
                byzantium: true,
                type: 0,
                contractAddress: null,
                cumulativeGasUsed: bnify(21000),
                from: "0x8c1e1e5b47980D214965f3bd8ea34C413E120ae4",
                gasUsed: bnify(21000),
                logsBloom: "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
                to: "0x58Bb4221245461E1d4cf886f18a01E3Df40Bd359",
                transactionHash: "0xec8b1ac5d787f36c738cc7793fec606283b41f1efa69df4ae6b2a014dcd12797",
                transactionIndex: 0,
                logs: [],
                status: 1
            }
        ],
    }
};
blockchainData["default"] = blockchainData.punkos;
function equals(name, actual, expected) {
    if (expected && expected.eq) {
        if (actual == null) {
            assert.ok(false, name + " - actual big number null");
        }
        expected = ethers.BigNumber.from(expected);
        actual = ethers.BigNumber.from(actual);
        assert.ok(expected.eq(actual), name + " matches");
    }
    else if (Array.isArray(expected)) {
        if (actual == null) {
            assert.ok(false, name + " - actual array null");
        }
        assert.equal(actual.length, expected.length, name + " array lengths match");
        for (let i = 0; i < expected.length; i++) {
            equals("(" + name + " - item " + i + ")", actual[i], expected[i]);
        }
    }
    else if (typeof (expected) === "object") {
        if (actual == null) {
            if (expected === actual) {
                return;
            }
            assert.ok(false, name + " - actual object null");
        }
        let keys = {};
        Object.keys(expected).forEach((key) => { keys[key] = true; });
        Object.keys(actual).forEach((key) => { keys[key] = true; });
        Object.keys(keys).forEach((key) => {
            equals("(" + name + " - key + " + key + ")", actual[key], expected[key]);
        });
    }
    else {
        if (actual == null) {
            assert.ok(false, name + " - actual null");
        }
        assert.equal(actual, expected, name + " matches");
    }
}
function waiter(duration) {
    return new Promise((resolve) => {
        const timer = setTimeout(resolve, duration);
        if (timer.unref) {
            timer.unref();
        }
    });
}
// 定义的测试网络provider
const providerFunctions = [
    // Add local provider for punkos test
    {
        name: "PunkosProvider",
        networks: ["default", "punkos"],
        create: (network) => {
            return new ethers.providers.JsonRpcProvider("http://localhost:36054");
        }
    }
];
// This wallet can be funded and used for various test cases
const fundWallet = ethers.Wallet.createRandom();
const testFunctions = [];
// 将数据编制成测试例子
Object.keys(blockchainData).forEach((network) => {
    // 名称-执行器-期望值
    function addSimpleTest(name, func, expected) {
        testFunctions.push({
            name: name,
            networks: [network],
            execute: (provider) => __awaiter(this, void 0, void 0, function* () {
                const value = yield func(provider);
                equals(name, expected, value);
            })
        });
    }
    function addObjectTest(name, func, expected, checkSkip) {
        testFunctions.push({
            name,
            networks: [network],
            checkSkip,
            execute: (provider) => __awaiter(this, void 0, void 0, function* () {
                const value = yield func(provider);
                Object.keys(expected).forEach((key) => {
                    equals(`${name}.${key}`, value[key], expected[key]);
                });
            })
        });
    }
    const tests = blockchainData[network];
    // And address test case can have any of the following:
    // - balance
    // - code
    // - storage
    // - ENS name
    tests.addresses.forEach((test) => {
        if (test.balance) {
            addSimpleTest(`fetches account balance: ${test.address}`, (provider) => {
                return provider.getBalance(test.address);
            }, test.balance);
        }
        if (test.interest) {
            addSimpleTest(`fetches account interest: ${test.address}`, (provider) => {
                return provider.getInterest(test.address);
            }, test.interest);
        }
        if (test.code) {
            addSimpleTest(`fetches account code: ${test.address}`, (provider) => {
                return provider.getCode(test.address);
            }, test.code);
        }
        if (test.storage) {
            Object.keys(test.storage).forEach((position) => {
                addSimpleTest(`fetches storage: ${test.address}:${position}`, (provider) => {
                    return provider.getStorageAt(test.address, bnify(position));
                }, test.storage[position]);
            });
        }
        // if (test.name) {
        //     addSimpleTest(`fetches ENS name: ${ test.address }`, (provider: ethers.providers.Provider) => {
        //         return provider.resolveName(test.name);
        //     }, test.address);
        // }
    });
    tests.blocks.forEach((test) => {
        addObjectTest(`fetches block (by number) #${test.number}`, (provider) => {
            return provider.getBlock(test.number);
        }, test);
        addObjectTest(`getPowGas`, (provider) => {
            return provider.getPowGas("latest");
        }, test);
        addObjectTest(`getPowPrice`, (provider) => {
            return provider.getPowPrice("latest");
        }, test);
        addObjectTest(`getAvgRatioNumerator`, (provider) => {
            return provider.getAvgRatioNumerator("latest");
        }, test);
        addObjectTest(`gettAvgRatioDenominator`, (provider) => {
            return provider.gettAvgRatioDenominator("latest");
        }, test);
        addObjectTest(`getAvgGasNumerator`, (provider) => {
            return provider.getAvgGasNumerator("latest");
        }, test);
        addObjectTest(`getAvgGasDenominator`, (provider) => {
            return provider.getAvgGasDenominator("latest");
        }, test);
    });
    // TODO 单节点网络测试的哈希不确定
    // tests.blocks.forEach((test) => {
    //     addObjectTest(`fetches block (by hash) ${ test.hash }`, (provider: ethers.providers.Provider) => {
    //         return provider.getBlock(test.hash);
    //     }, test, (provider: string, network: string, test: TestDescription) => {
    //         return (provider === "EtherscanProvider");
    //     });
    // });
    // 测试获取交易
    tests.transactions.forEach((test) => {
        const hash = test.hash;
        addObjectTest(`fetches transaction ${hash}`, (provider) => __awaiter(void 0, void 0, void 0, function* () {
            const tx = yield provider.getTransaction(hash);
            // This changes with every block
            assert.equal(typeof (tx.confirmations), "number", "confirmations is a number");
            delete tx.confirmations;
            assert.equal(typeof (tx.wait), "function", "wait is a function");
            delete tx.wait;
            return tx;
        }), test, (provider, network, test) => {
            // Temporary; pocket is being broken again for old transactions
            return provider === "PocketProvider";
            //return false;
        });
    });
    // 测试获取交易回执
    tests.transactionReceipts.forEach((test) => {
        const hash = test.transactionHash;
        addObjectTest(`fetches transaction receipt ${hash}`, (provider) => __awaiter(void 0, void 0, void 0, function* () {
            const receipt = yield provider.getTransactionReceipt(hash);
            assert.ok(!!receipt, "missing receipt");
            if (test.status === null) {
                assert.ok(receipt.status === undefined, "no status");
                receipt.status = null;
            }
            // This changes with every block; so just make sure it is a number
            assert.equal(typeof (receipt.confirmations), "number", "confirmations is a number");
            delete receipt.confirmations;
            return receipt;
        }), test, (provider, network, test) => {
            // Temporary; pocket is being broken again for old transactions
            return provider === "PocketProvider";
            //return false;
        });
    });
});
// 添加错误测试例子
(function () {
    function addErrorTest(code, func) {
        testFunctions.push({
            name: `throws correct ${code} error`,
            networks: ["sepolia"],
            checkSkip: (provider, network, test) => {
                return false;
            },
            execute: (provider) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const value = yield func(provider);
                    console.log(value);
                    assert.ok(false, "did not throw");
                }
                catch (error) {
                    assert.equal(error.code, code, `incorrect error thrown: actual:${error.code} != expected:${code}`);
                }
            })
        });
    }
    /*
    @TODO: Use this for testing pre-EIP-155 transactions on specific networks
    addErrorTest(ethers.utils.Logger.errors.NONCE_EXPIRED, async (provider: ethers.providers.Provider) => {
        return provider.sendTransaction("0xf86480850218711a0082520894000000000000000000000000000000000000000002801ba038aaddcaaae7d3fa066dfd6f196c8348e1bb210f2c121d36cb2c24ef20cea1fba008ae378075d3cd75aae99ab75a70da82161dffb2c8263dabc5d8adecfa9447fa");
    });
    */
    // Wallet(id("foobar1234"))
    addErrorTest(ethers.utils.Logger.errors.NONCE_EXPIRED, (provider) => __awaiter(this, void 0, void 0, function* () {
        return provider.sendTransaction("0x02f86e05808459682f008459682f14830186a09475544911a6f2e69ceea374f3f7e5ea9c987ece098304cb2f80c001a0d9585a780dde9e7d8c855aacec0564054b49114931fd7e320e4e983009d864f7a050bee916f2770ef17367256d8bccfbc49885467a6ba27cf5cc57e8553c73a191");
    }));
    addErrorTest(ethers.utils.Logger.errors.INSUFFICIENT_FUNDS, (provider) => __awaiter(this, void 0, void 0, function* () {
        const txProps = {
            to: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
            gasPrice: 9000000000,
            gasLimit: 21000,
            chainId: 5,
            value: 1,
        };
        const wallet = ethers.Wallet.createRandom();
        const tx = yield wallet.signTransaction(txProps);
        return provider.sendTransaction(tx);
    }));
    addErrorTest(ethers.utils.Logger.errors.INSUFFICIENT_FUNDS, (provider) => __awaiter(this, void 0, void 0, function* () {
        const txProps = {
            to: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
            gasPrice: 9000000000,
            gasLimit: 21000,
            value: 1,
        };
        const wallet = ethers.Wallet.createRandom().connect(provider);
        return wallet.sendTransaction(txProps);
    }));
    addErrorTest(ethers.utils.Logger.errors.UNPREDICTABLE_GAS_LIMIT, (provider) => __awaiter(this, void 0, void 0, function* () {
        return provider.estimateGas({
            to: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" // ENS contract
        });
    }));
})();
/*
testFunctions.push({
    name: "sends a legacy transaction",
    extras: [ "funding" ],         // We need funding to the fundWallet
    timeout: 900,                  // 15 minutes
    networks: [ "sepolia" ],       // Only test on sepolia
    checkSkip: (provider: string, network: string, test: TestDescription) => {
        // This isn't working right now on Ankr
        return (provider === "AnkrProvider");
    },
    execute: async (provider: ethers.providers.Provider) => {
        const gasPrice = (await provider.getGasPrice()).mul(10);

        const wallet = fundWallet.connect(provider);

        const addr = "0x8210357f377E901f18E45294e86a2A32215Cc3C9";

        await waiter(3000);

        const b0 = await provider.getBalance(wallet.address);
        assert.ok(b0.gt(ethers.constants.Zero), "balance is non-zero");

        const tx = await wallet.sendTransaction({
            type: 0,
            to: addr,
            value: 123,
            gasPrice: gasPrice
        });

        await tx.wait();

        await waiter(3000);

        const b1 = await provider.getBalance(wallet.address);
        assert.ok(b0.gt(b1), "balance is decreased");
    }
});
*/
testFunctions.push({
    name: "sends an EIP-2930 transaction",
    extras: ["funding"],
    timeout: 900,
    networks: ["sepolia"],
    checkSkip: (provider, network, test) => {
        // This isn't working right now on Ankr
        return (provider === "AnkrProvider");
    },
    execute: (provider) => __awaiter(void 0, void 0, void 0, function* () {
        const gasPrice = (yield provider.getGasPrice()).mul(10);
        const wallet = fundWallet.connect(provider);
        const addr = "0x8210357f377E901f18E45294e86a2A32215Cc3C9";
        yield waiter(3000);
        const b0 = yield provider.getBalance(wallet.address);
        assert.ok(b0.gt(ethers.constants.Zero), "balance is non-zero");
        const tx = yield wallet.sendTransaction({
            type: 1,
            //chainId: (await provider.getNetwork()).chainId,
            accessList: {
                "0x8ba1f109551bD432803012645Ac136ddd64DBA72": [
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000042",
                ]
            },
            to: addr,
            value: 123,
            gasPrice: gasPrice
        });
        yield tx.wait();
        yield waiter(3000);
        const b1 = yield provider.getBalance(wallet.address);
        assert.ok(b0.gt(b1), "balance is decreased");
    })
});
testFunctions.push({
    name: "sends an EIP-1559 transaction",
    extras: ["funding"],
    timeout: 900,
    networks: ["sepolia"],
    checkSkip: (provider, network, test) => {
        // These don't support EIP-1559 yet for sending
        //return (provider === "AlchemyProvider" );
        return (provider === "AnkrProvider");
    },
    execute: (provider) => __awaiter(void 0, void 0, void 0, function* () {
        const wallet = fundWallet.connect(provider);
        const addr = "0x8210357f377E901f18E45294e86a2A32215Cc3C9";
        yield waiter(3000);
        const b0 = yield provider.getBalance(wallet.address);
        assert.ok(b0.gt(ethers.constants.Zero), "balance is non-zero");
        const tx = yield wallet.sendTransaction({
            type: 2,
            accessList: {
                "0x8ba1f109551bD432803012645Ac136ddd64DBA72": [
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    "0x0000000000000000000000000000000000000000000000000000000000000042",
                ]
            },
            to: addr,
            value: 123,
        });
        yield tx.wait();
        yield waiter(3000);
        const b1 = yield provider.getBalance(wallet.address);
        assert.ok(b0.gt(b1), "balance is decreased");
    })
});
// Provider测试执行入口
describe("Test Provider Methods", function () {
    let fundReceipt = null;
    // 测试开始前
    before(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(300000);
            // Get some ether from the faucet
            //const funder = await ethers.utils.fetchJson(`https:/\/api.ethers.io/api/v1/?action=fundAccount&address=${ fundWallet.address.toLowerCase() }`);
            fundReceipt = fundAddress(fundWallet.address).then((hash) => {
                console.log(`*** Funded: ${fundWallet.address}`);
                return hash;
            });
        });
    });
    // 测试结束后
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(300000);
            // Wait until the funding is complete
            yield fundReceipt;
            // Refund all unused ether to the faucet
            const hash = yield returnFunds(fundWallet);
            console.log(`*** Sweep Transaction:`, hash);
        });
    });
    // 遍历每个provider 
    providerFunctions.forEach(({ name, networks, create }) => {
        // 遍历每个provider支持的网络
        networks.forEach((network) => {
            // 创建provider
            const provider = create(network);
            // 遍历每个测试用例
            testFunctions.forEach((test) => {
                // Skip tests not supported on this network
                if (test.networks.indexOf(network) === -1) {
                    return;
                }
                if (test.checkSkip && test.checkSkip(name, network, test)) {
                    return;
                }
                // How many attempts to try?
                const attempts = (test.attempts != null) ? test.attempts : 3;
                const timeout = (test.timeout != null) ? test.timeout : 60;
                const extras = (test.extras || []).reduce((accum, key) => {
                    accum[key] = true;
                    return accum;
                }, {});
                it(`${name}.${network ? network : "default"} ${test.name}`, function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        // Multiply by 2 to make sure this never happens; we want our
                        // timeout logic to success, not allow a done() called multiple
                        // times because our logic returns after the timeout has occurred.
                        this.timeout(2 * (1000 + timeout * 1000 * attempts));
                        // Wait for the funding transaction to be mined
                        if (extras.funding) {
                            yield fundReceipt;
                        }
                        // We wait at least 1 seconds between tests
                        if (!extras.nowait) {
                            yield waiter(1000);
                        }
                        let error = null;
                        for (let attempt = 0; attempt < attempts; attempt++) {
                            try {
                                const result = yield Promise.race([
                                    test.execute(provider),
                                    waiter(timeout * 1000).then((result) => { throw new Error("timeout"); })
                                ]);
                                return result;
                            }
                            catch (attemptError) {
                                console.log(`*** Failed attempt ${attempt + 1}: ${attemptError.message}`);
                                error = attemptError;
                                // On failure, wait 5s
                                yield waiter(5000);
                            }
                        }
                        throw error;
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=test-providers-punkos.js.map