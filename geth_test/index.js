const {provider,wallet,newDynamicFeeTx}=require("./tx.js");
const {testVoucher,getAllVouchers}=require("./voucher.js");
const {testGetPostQuanCounter,startMining}=require("./geth_api.js");
const {sendTransactionWithProvider}=require("./send.js");
const {testcoprocessor}=require("./coprocessor.js")



async function main() {
    
    // * Test geth API(read method)
    // testConnection();
    await startMining();
    // await testGetPostQuanCounter();
    // testDepositAPI();

    // *Test Voucher

    // await testVoucher();

    // *Test Coprocessor
    // await testcoprocessor();

    // * Test tx send(write method)
    // tx=await newDynamicFeeTx();
    // await sendTransactionWithProvider(tx);
    // await sendRawTransaction();
    


    // * Attempt to get private key and address
    // const password = "123456"; 
    // const keystorePath = "./UTC--2025-01-02T06-44-10.632476887Z--57f96028ba3258ebfb4940d67443967cf23e3fc4";
    // decodeAddress(keystorePath,password)
}

main();