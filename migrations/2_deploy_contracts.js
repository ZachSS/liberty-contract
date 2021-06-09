const BidNFT = artifacts.require("BidNFT");
const LibertyNFT = artifacts.require("LibertyNFT");

const Canvas = artifacts.require("Canvas");
const Pixel = artifacts.require("Pixel");
const BUSD = artifacts.require("BUSD");

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

module.exports = function (deployer, network, accounts) {
    deployerAccount = accounts[0];
    feeAddr = accounts[1];

    deployer.deploy(Canvas).then(async () => {
        await deployer.deploy(Pixel);
        await deployer.deploy(BUSD);

        await deployer.deploy(LibertyNFT, "Liberty NFT", "Liberty", Pixel.address, Canvas.address, feeAddr, web3.utils.toBN(1e18).mul(web3.utils.toBN(10)), web3.utils.toBN(1e18));

        await deployer.deploy(BidNFT, LibertyNFT.address, BUSD.address, feeAddr, web3.utils.toBN(2));
    });
};
