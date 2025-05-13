"use strict";

import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { BytesLike, isHexString } from "@ethersproject/bytes";
import { Network } from "@ethersproject/networks";
import { Deferrable, Description, defineReadOnly, resolveProperties } from "@ethersproject/properties";
import { AccessListish, Transaction } from "@ethersproject/transactions";
import { OnceBlockable } from "@ethersproject/web";

import { Logger } from "@ethersproject/logger";
import { version } from "./_version";
const logger = new Logger(version);

///////////////////////////////
// Exported Types


export type TransactionRequest = {
    to?: string,
    from?: string,
    nonce?: BigNumberish,

    gasLimit?: BigNumberish,
    gasPrice?: BigNumberish,

    data?: BytesLike,
    value?: BigNumberish,
    chainId?: number

    type?: number;
    accessList?: AccessListish;

    maxPriorityFeePerGas?: BigNumberish;
    maxFeePerGas?: BigNumberish;

    customData?: Record<string, any>;
    ccipReadEnabled?: boolean;

    // DynamicCrypto; Type 5
    postAddress?:BytesLike
    cryptoType?:BytesLike  
    signatureData?:BytesLike
    publicKey?:BytesLike
    
    // Deposit; Type 6
    deployerAddress?:BytesLike;
	investorAddress ?:BytesLike;
	beneficiaryAddress?:BytesLike;
	stakedAmount?:BigNumberish;
	stakedTime?:number;

    // Nested; Type 7
    nestingDepth?:number;
    innerTxData?:BytesLike;
}

export interface TransactionResponse extends Transaction {
    hash: string;

    // Only if a transaction has been mined
    blockNumber?: number,
    blockHash?: string,
    timestamp?: number,

    confirmations: number,

    // Not optional (as it is in Transaction)
    from: string;

    // The raw transaction
    raw?: string,

    // This function waits until the transaction has been mined
    wait: (confirmations?: number) => Promise<TransactionReceipt>
};

export type BlockTag = string | number;

export interface _Block {
    hash: string;
    parentHash: string;
    number: number;

    timestamp: number;
    nonce: string;
    difficulty: number;
    _difficulty: BigNumber;

    gasLimit: BigNumber;
    gasUsed: BigNumber;

    miner: string;
    extraData: string;

    baseFeePerGas?: null | BigNumber;
}

export interface Block extends _Block {
    transactions: Array<string>;
}

export interface BlockWithTransactions extends _Block {
    transactions: Array<TransactionResponse>;
}


export interface Log {
    blockNumber: number;
    blockHash: string;
    transactionIndex: number;

    removed: boolean;

    address: string;
    data: string;

    topics: Array<string>;

    transactionHash: string;
    logIndex: number;
}

export interface TransactionReceipt {
    to: string;
    from: string;
    contractAddress: string,
    transactionIndex: number,
    root?: string,
    gasUsed: BigNumber,
    logsBloom: string,
    blockHash: string,
    transactionHash: string,
    logs: Array<Log>,
    blockNumber: number,
    confirmations: number,
    cumulativeGasUsed: BigNumber,
    effectiveGasPrice: BigNumber,
    byzantium: boolean,
    type: number;
    status?: number
};

export interface FeeData {
    lastBaseFeePerGas: null | BigNumber;
    maxFeePerGas: null | BigNumber;
    maxPriorityFeePerGas: null | BigNumber;
    gasPrice: null | BigNumber;
}

export interface EventFilter {
    address?: string;
    topics?: Array<string | Array<string> | null>;
}

export interface Filter extends EventFilter {
    fromBlock?: BlockTag,
    toBlock?: BlockTag,
}

export interface FilterByBlockHash extends EventFilter {
    blockHash?: string;
}

//export type CallTransactionable = {
//    call(transaction: TransactionRequest): Promise<TransactionResponse>;
//};

export abstract class ForkEvent extends Description {
    readonly expiry: number;

    readonly _isForkEvent?: boolean;

    static isForkEvent(value: any): value is ForkEvent {
        return !!(value && value._isForkEvent);
    }
}

export class BlockForkEvent extends ForkEvent {
    readonly blockHash: string;

    readonly _isBlockForkEvent?: boolean;

    constructor(blockHash: string, expiry?: number) {
        if (!isHexString(blockHash, 32)) {
            logger.throwArgumentError("invalid blockHash", "blockHash", blockHash);
        }

        super({
            _isForkEvent: true,
            _isBlockForkEvent: true,
            expiry: (expiry || 0),
            blockHash: blockHash
        });
    }
}

export class TransactionForkEvent extends ForkEvent {
    readonly hash: string;

    readonly _isTransactionOrderForkEvent?: boolean;

    constructor(hash: string, expiry?: number) {
        if (!isHexString(hash, 32)) {
            logger.throwArgumentError("invalid transaction hash", "hash", hash);
        }

        super({
            _isForkEvent: true,
            _isTransactionForkEvent: true,
            expiry: (expiry || 0),
            hash: hash
        });
    }
}

export class TransactionOrderForkEvent extends ForkEvent {
    readonly beforeHash: string;
    readonly afterHash: string;

    constructor(beforeHash: string, afterHash: string, expiry?: number) {
        if (!isHexString(beforeHash, 32)) {
            logger.throwArgumentError("invalid transaction hash", "beforeHash", beforeHash);
        }
        if (!isHexString(afterHash, 32)) {
            logger.throwArgumentError("invalid transaction hash", "afterHash", afterHash);
        }

        super({
            _isForkEvent: true,
            _isTransactionOrderForkEvent: true,
            expiry: (expiry || 0),
            beforeHash: beforeHash,
            afterHash: afterHash
        });
    }
}

export type EventType = string | Array<string | Array<string>> | EventFilter | ForkEvent;

export type Listener = (...args: Array<any>) => void;

///////////////////////////////
// Exported Abstracts
export abstract class Provider implements OnceBlockable {

    // Network
    abstract getNetwork(): Promise<Network>;

    // Latest State
    abstract getBlockNumber(): Promise<number>;
    abstract getGasPrice(): Promise<BigNumber>;
    async getFeeData(): Promise<FeeData> {
        const { block, gasPrice } = await resolveProperties({
            block: this.getBlock("latest"),
            gasPrice: this.getGasPrice().catch((error) => {
                // @TODO: Why is this now failing on Calaveras?
                //console.log(error);
                return null;
            })
        });

        let lastBaseFeePerGas = null, maxFeePerGas = null, maxPriorityFeePerGas = null;

        if (block && block.baseFeePerGas) {
            // We may want to compute this more accurately in the future,
            // using the formula "check if the base fee is correct".
            // See: https://eips.ethereum.org/EIPS/eip-1559
            lastBaseFeePerGas = block.baseFeePerGas;
            maxPriorityFeePerGas = BigNumber.from("1500000000");
            maxFeePerGas = block.baseFeePerGas.mul(2).add(maxPriorityFeePerGas);
        }

        return { lastBaseFeePerGas, maxFeePerGas, maxPriorityFeePerGas, gasPrice };
    }

    // Account
    abstract getBalance(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber>;

    // Add punkos defined functions
    // 获取利息
    abstract getInterest(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber>;
    // 获取安全等级
    abstract getSecurityLevel(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber>;
    // GetPowDifficulty 返回指定区块的PowDifficulty
    abstract getPowDifficulty(blockHashOrNumber: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber>;
	// GetPowGas 返回指定区块的PowGas
    abstract getPowGas(blockHashOrNumber: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber>;
	// GetPowPrice 返回指定区块的PowPrice
    abstract getPowPrice(blockHashOrNumber: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber>;
	// GetAvgRatioNumerator 返回指定区块的AvgRatioNumerator
    abstract getAvgRatioNumerator(blockHashOrNumber: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber>;
	// GetAvgRatioDenominator 返回指定区块的AvgRatioDenominator
    abstract gettAvgRatioDenominator(blockHashOrNumber: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber>;
	// GetAvgGasNumerator 返回指定区块的AvgGasNumerator
    abstract getAvgGasNumerator(blockHashOrNumber: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber>;
	// GetAvgGasDenominator 返回指定区块的AvgGasDenominator
    abstract getAvgGasDenominator(blockHashOrNumber: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber>;
	// GetPoSLeader 返回指定区块的PoSLeader
    abstract gePoSLeader(blockHashOrNumber: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber>;
	// GetPoSVoting 返回指定区块的PoSVoting
    abstract getPoSVoting(blockHashOrNumber: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<Uint8Array>;
	// GetCommitTxLength 返回指定区块的CommitTxLength
    abstract getCommitTxLength(blockHashOrNumber: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber>;
	// GetIncentive 返回指定区块的Incentive
    abstract getIncentive(blockHashOrNumber: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber>;
    // GetPostQuanCounter return postquan tx counter of given address
    abstract getPostQuanCounter(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<number>;

    abstract getTransactionCount(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<number>;
    abstract getCode(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string> ;
    abstract getStorageAt(addressOrName: string | Promise<string>, position: BigNumberish | Promise<BigNumberish>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string>;

    // Execution
    abstract sendTransaction(signedTransaction: string | Promise<string>): Promise<TransactionResponse>;
    abstract call(transaction: Deferrable<TransactionRequest>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string>;
    abstract estimateGas(transaction: Deferrable<TransactionRequest>): Promise<BigNumber>;

    // Queries
    abstract getBlock(blockHashOrBlockTag: BlockTag | string | Promise<BlockTag | string>): Promise<Block>;
    abstract getBlockWithTransactions(blockHashOrBlockTag: BlockTag | string | Promise<BlockTag | string>): Promise<BlockWithTransactions>;
    abstract getTransaction(transactionHash: string): Promise<TransactionResponse>;
    abstract getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt>;

    // Bloom-filter Queries
    abstract getLogs(filter: Filter): Promise<Array<Log>>;

    // ENS
    abstract resolveName(name: string | Promise<string>): Promise<null | string>;
    abstract lookupAddress(address: string | Promise<string>): Promise<null | string>;

    // Event Emitter (ish)
    abstract on(eventName: EventType, listener: Listener): Provider;
    abstract once(eventName: EventType, listener: Listener): Provider;
    abstract emit(eventName: EventType, ...args: Array<any>): boolean
    abstract listenerCount(eventName?: EventType): number;
    abstract listeners(eventName?: EventType): Array<Listener>;
    abstract off(eventName: EventType, listener?: Listener): Provider;
    abstract removeAllListeners(eventName?: EventType): Provider;

    // Alias for "on"
    addListener(eventName: EventType, listener: Listener): Provider {
        return this.on(eventName, listener);
    }

    // Alias for "off"
    removeListener(eventName: EventType, listener: Listener): Provider {
        return this.off(eventName, listener);
    }

    // @TODO: This *could* be implemented here, but would pull in events...
    abstract waitForTransaction(transactionHash: string, confirmations?: number, timeout?: number): Promise<TransactionReceipt>;

    readonly _isProvider: boolean;

    constructor() {
        logger.checkAbstract(new.target, Provider);
        defineReadOnly(this, "_isProvider", true);
    }

    static isProvider(value: any): value is Provider {
        return !!(value && value._isProvider);
    }

/*
    static getResolver(network: Network, callable: CallTransactionable, namehash: string): string {
        // No ENS...
        if (!network.ensAddress) {
            errors.throwError(
                "network does support ENS",
                errors.UNSUPPORTED_OPERATION,
                { operation: "ENS", network: network.name }
            );
        }

        // Not a namehash
        if (!isHexString(namehash, 32)) {
            errors.throwArgumentError("invalid name hash", "namehash", namehash);
        }

        // keccak256("resolver(bytes32)")
        let data = "0x0178b8bf" + namehash.substring(2);
        let transaction = { to: network.ensAddress, data: data };

        return provider.call(transaction).then((data) => {
            return provider.formatter.callAddress(data);
        });
    }

    static resolveNamehash(network: Network, callable: CallTransactionable, namehash: string): string {
        return this.getResolver(network, callable, namehash).then((resolverAddress) => {
            if (!resolverAddress) { return null; }

            // keccak256("addr(bytes32)")
            let data = "0x3b3b57de" + namehash(name).substring(2);
            let transaction = { to: resolverAddress, data: data };
            return callable.call(transaction).then((data) => {
                return this.formatter.callAddress(data);
            });

        })
    }
*/
}
