const {provider,wallet}=require("./tx.js");
const {addVoucherName,testVoucher}=require("./voucher.js");
const {testGetPostQuanCounter}=require("./geth_api.js");

module.exports={
    testConnection,
    sendRawTransaction,
    sendTransactionWithProvider,
}


// Test Connection
async function testConnection() {
    try {
        // 获取当前区块号
        const blockNumber = await provider.getBlockNumber();
        console.log("当前区块号:", blockNumber);
        // 获取网络信息
        const network = await provider.getNetwork();
        console.log("网络信息:", network);
        // 获取链 ID
        const chainId = await provider.getNetwork().then(net => net.chainId);
        console.log("链 ID:", chainId);
    } catch (error) {
        console.error("连接 Geth 节点失败:", error);
    }
}

async function sendRawTransaction(tx) {
    try {
        // Check chain whether approve London(EIP-1559)
        const isLondonActive = await provider.send("eth_getBlockByNumber", ["latest", false]);
        if (isLondonActive.baseFeePerGas) {
            console.log("London hardfork is active, EIP-1559 supported");
        } else {
            console.log("London hardfork is not active, EIP-1559 not supported");
        }
        // Sign tx, signed tx will be rlp coding
        const signedTx = await wallet.signTransaction(tx);
        // Send tx with signature
        const txHash = await provider.send("eth_sendRawTransaction", [signedTx]);
        console.log("Tx has send, Hash:", txHash);
        // Wait tx execute
        const receipt = await provider.waitForTransaction(txHash);
        console.log("Tx is execute");
    } catch (error) {
        console.error("Tx send error:", error);
    }
}


async function sendTransactionWithProvider(tx) {
    try {
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


