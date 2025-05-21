const {provider,wallet}=require("./tx.js");

module.exports={
    testGetPostQuanCounter,
    testDepositAPI,
    startMining,
};

async function testGetPostQuanCounter(){
    const lookAddress="0xaDEEeEb9d0eed7BAfe099B2A371671BAa2255B0A"
    const postquancounter = await provider.getPostQuanCounter(lookAddress, "latest");
    console.log("sender address:", lookAddress, "with postquan counter", postquancounter);

    const nonce = await provider.getTransactionCount(lookAddress, "latest");
    console.log("sender address:", lookAddress, "with nonce", nonce);
}


async function testDepositAPI(){
    var year=await provider.getPledgeYear(wallet.address,"latest");
    var address=await provider.getDeployedAddress(wallet.address,"latest");
    var flag=await provider.getStakeFlag(wallet.address,"latest");
    console.log("year:",year);
    console.log("address:",address);
    console.log("flag:",flag)
}

// Check chain whether start mining. If miner don't start
async function startMining() {
    try {
        const isMining = await provider.send("eth_mining", []);
        console.log("Is mining? ", isMining);
        if (isMining) {
            console.log("Miner start")
        } else {
            var minerAddr = '0x57F96028bA3258ebFb4940d67443967cF23e3fc4'
            // Set etherbase
            await provider.send("miner_setEtherbase", [minerAddr])
            console.log("Attempt to begin mining...");
            await provider.send("miner_start", []);
            console.log("Miner is start");
        }
    } catch (error) {
        console.error("Miner start error", error);
    }
}
