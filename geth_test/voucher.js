const { ethers } = require("ethers");
const { provider, wallet, newDynamicFeeTx } = require("./tx.js");

module.exports = {
    createVoucher,
    buy,
    addVoucherName,
    getVoucherInfo,
    balanceOf,
    testVoucher,
    getAllVouchers,
};

const voucherContractABI = [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"string","name":"voucherName","type":"string"},{"indexed":false,"internalType":"uint256","name":"conversionRate","type":"uint256"}],"name":"VoucherCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"buyer","type":"address"},{"indexed":false,"internalType":"string","name":"voucherName","type":"string"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"VoucherPurchased","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"string","name":"voucherName","type":"string"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"VoucherUsed","type":"event"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"address","name":"user","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"}],"name":"buy","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"conversionRate","type":"uint256"}],"name":"createVoucher","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getAllVouchers","outputs":[{"internalType":"string[]","name":"","type":"string[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"}],"name":"getVoucherInfo","outputs":[{"internalType":"uint256","name":"conversionRate","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"use","outputs":[],"stateMutability":"nonpayable","type":"function"}];

const voucherContractAddress = "0x0000000000000000000000000000000000000044";


const voucher = new ethers.Contract(
    voucherContractAddress,
    voucherContractABI,
    // If use provider, only imporve read.
    wallet
);


async function createVoucher(name, rate) {
    try {
        var tx = await voucher.createVoucher(name, rate,{
            maxFeePerGas: ethers.utils.parseUnits("100", "gwei"), 
            maxPriorityFeePerGas: ethers.utils.parseUnits("1", "gwei"), 
        });
        await provider.waitForTransaction(tx.hash);
    } catch (error) {
        console.error("create voucher failed");
        throw error;
    }
}


async function buy(name, value) {
    try {
        var tx = await voucher.buy(name, {
            maxFeePerGas: ethers.utils.parseUnits("100", "gwei"), 
            maxPriorityFeePerGas: ethers.utils.parseUnits("1", "gwei"), 
            value: value,
        });
        await provider.waitForTransaction(tx.hash);
    } catch (error) {
        console.error("buy voucher failed");
        throw error;
    }
}


async function addVoucherName(tx, voucherName) {
    // Convert voucherName to hex coding, then padding len to 20.
    var nameBytes = ethers.utils.toUtf8Bytes(voucherName);
    var hexStr = ethers.utils.hexlify(nameBytes);
    
    while (hexStr.length < 42) {
        hexStr=hexStr+"0";
    }

    var identifier = "0x0A0D03";
    console.log(tx)
    tx.data = ethers.utils.hexConcat([identifier,hexStr, tx.data||"0x"]);
    return tx;
}

// Send the transaction to geth and pay for the gas with voucher
async function sendTransactionWithVoucher(tx,voucherName) {
    try {

        addVoucherName(tx,voucherName)
        // Sign tx, signed tx will be rlp coding
        const signedTx = await wallet.signTransaction(tx);
        // Send tx with signature
        const txResponse = await provider.sendTransaction(signedTx);
        txHash = txResponse.hash;
        console.log("Tx has send, tx hash:", txHash);
        // Wait tx execute
        const receipt = await provider.waitForTransaction(txHash);
        console.log("Tx is execute");
    } catch (error) {
        console.error("Tx send error:", error);
    }
}

// ! Attention use can't explicit call
async function use(name, amount) {
    try {
        var tx = await voucher.use(name, amount, {
            value: amount,
        });
        await provider.waitForTransaction(tx.hash);
    } catch (error) {
        console.error("use voucher failed");
        throw error;
    }
}

// GetVoucherInfo return voucher's exchange rate
async function getVoucherInfo(name) {
    try {
        const rate = await voucher.getVoucherInfo(name);
        return rate;
    } catch (error) {
        console.error(`get ${name} voucher info failed:`);
        throw error;
    }
}

async function balanceOf(name, address) {
    try {
        const balance = await voucher.balanceOf(name, address);
        return balance;
    } catch (error) {
        console.error(`get balance of ${address} failed:`);
        throw error;
    }
}


async function getAllVouchers(){
    try {
        const vouchers = await voucher.getAllVouchers();
        return vouchers;
    } catch (error) {
        console.error("get all voucher failed:");
        throw error;
    }
}

async function testVoucher() {
    // Test upload algorithm 
    await createVoucher("BitCoin", 100);
    await buy("BitCoin", ethers.utils.parseUnits("1", 18));
    let balance=await balanceOf("BitCoin",wallet.address);
    console.log(getAllVouchers())
    console.log(balance);
    tx=await newDynamicFeeTx();
    sendTransactionWithVoucher(tx,"BitCoin");
}

