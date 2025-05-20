const { ethers } = require("ethers");
const {provider,wallet}=require("./tx.js");
const { get } = require("http");


module.exports={
    uploadCode,
    updataGas,
    getInfo,
    testcoprocessor,
    getAllAlgo,
};

const contractABI = [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"string","name":"name","type":"string"}],"name":"codeUploaded","type":"event"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"bytes","name":"input","type":"bytes"}],"name":"callFunc","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getAllAlgo","outputs":[{"internalType":"string[]","name":"","type":"string[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"}],"name":"getGas","outputs":[{"internalType":"uint64","name":"","type":"uint64"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"}],"name":"getInfo","outputs":[{"internalType":"string","name":"code","type":"string"},{"internalType":"uint64","name":"gas","type":"uint64"},{"internalType":"string","name":"itype","type":"string"},{"internalType":"string","name":"otype","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint64","name":"_gas","type":"uint64"}],"name":"updataGas","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"code","type":"string"},{"internalType":"uint64","name":"gas","type":"uint64"},{"internalType":"string","name":"itype","type":"string"},{"internalType":"string","name":"otype","type":"string"}],"name":"uploadCode","outputs":[],"stateMutability":"nonpayable","type":"function"}];

const contractAddress = "0x0000000000000000000000000000000000000043"; 


const contract = new ethers.Contract(
  contractAddress,
  contractABI,
  // If use provider, only imporve read.
  wallet
);


async function uploadCode(name,code,gas,itype,otype){
    try{
        var tx=await contract.uploadCode(name,code,gas,itype,otype,{
            maxFeePerGas: ethers.utils.parseUnits("100", "gwei"), 
            maxPriorityFeePerGas: ethers.utils.parseUnits("1", "gwei"), 
        });
        await provider.waitForTransaction(tx.hash);
    }catch(error){
        console.error("upload algorithm failed:");
        throw error;
    }
}

async function updataGas(name,gas){
    try{
        var tx=await contract.updataGas(name,gas,{
            maxFeePerGas: ethers.utils.parseUnits("100", "gwei"), 
            maxPriorityFeePerGas: ethers.utils.parseUnits("1", "gwei"), 
        });
        await provider.waitForTransaction(tx.hash);
    }catch(error){
        console.error("update algorithm gas failed:");
        throw error;
    }
}

// GetCodeInfo
async function getInfo(name){
    try{
        const [code,gas,itype,otype]=await contract.getInfo(name);
        return [code,gas,itype,otype];
    }catch(error){
        console.error("get algorithm info failed:");
        throw error;
    }
}

async function getAllAlgo(){
    try{
        let algos=await contract.getAllAlgo();
        return algos
    }catch(error){
        console.error("get all algorithm name failed:");
        throw error;
    }
}

async function testcoprocessor(){
    // Test upload algorithm 
    const algoname="Add"
    const code="H4sIAAAAAAAA/ypITM5OTE9VyE3MzOPiyswtyC8qUdDg4lTKTSzJ0E/KTFfi0uTiSivNS1ZwTEnRSFTQSspM1/PMK9FRSIKzNeEshWouzqLUktKiPIVEPbAGHYUkTa5aLkAAAAD//9dFMqpoAAAA"
    const gas=100;
    const itype="int256,int256";
    const otype="int256";
    await uploadCode(algoname,code,gas,itype,otype);

    // Get algorithm info
    var [rcode,rgas,ritype,rotype]=await getInfo(algoname);
    console.log(rcode,rgas,ritype,rotype);

    var algos=await getAllAlgo();
    console.log(algos);
}
