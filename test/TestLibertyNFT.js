const BidNFT = artifacts.require("BidNFT");
const LibertyNFT = artifacts.require("LibertyNFT");

const Canvas = artifacts.require("Canvas");
const Pixel = artifacts.require("Pixel");

const Web3 = require('web3');
const truffleAssert = require('truffle-assertions');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

const tokenPrecision = web3.utils.toBN("1000000000000000000");

contract('LibertyNFT Contract', (accounts) => {
    it('Test Transfer Token to players', async () => {
        const deployerAccount = accounts[0];
        const feeAddr = accounts[1];

        const player0 = accounts[2];
        const player1 = accounts[3];
        const player2 = accounts[4];
        const player3 = accounts[5];

        const pixelTokenInst = await Pixel.deployed();
        const canvasTokenInst = await Canvas.deployed();

        await pixelTokenInst.transfer(player0, web3.utils.toBN(1e4).mul(tokenPrecision), {from: deployerAccount});
        await pixelTokenInst.transfer(player1, web3.utils.toBN(1e4).mul(tokenPrecision), {from: deployerAccount});
        await pixelTokenInst.transfer(player2, web3.utils.toBN(1e4).mul(tokenPrecision), {from: deployerAccount});
        await pixelTokenInst.transfer(player3, web3.utils.toBN(1e4).mul(tokenPrecision), {from: deployerAccount});

        await canvasTokenInst.transfer(player0, web3.utils.toBN(2e4).mul(tokenPrecision), {from: deployerAccount});
        await canvasTokenInst.transfer(player1, web3.utils.toBN(2e4).mul(tokenPrecision), {from: deployerAccount});
        await canvasTokenInst.transfer(player2, web3.utils.toBN(2e4).mul(tokenPrecision), {from: deployerAccount});
        await canvasTokenInst.transfer(player3, web3.utils.toBN(2e4).mul(tokenPrecision), {from: deployerAccount});

        await pixelTokenInst.approve(LibertyNFT.address, web3.utils.toBN(1e8).mul(tokenPrecision), {from: player0});
        await pixelTokenInst.approve(LibertyNFT.address, web3.utils.toBN(1e8).mul(tokenPrecision), {from: player1});
        await pixelTokenInst.approve(LibertyNFT.address, web3.utils.toBN(1e8).mul(tokenPrecision), {from: player2});
        await pixelTokenInst.approve(LibertyNFT.address, web3.utils.toBN(1e8).mul(tokenPrecision), {from: player3});

        await canvasTokenInst.approve(LibertyNFT.address, web3.utils.toBN(1e8).mul(tokenPrecision), {from: player0});
        await canvasTokenInst.approve(LibertyNFT.address, web3.utils.toBN(1e8).mul(tokenPrecision), {from: player1});
        await canvasTokenInst.approve(LibertyNFT.address, web3.utils.toBN(1e8).mul(tokenPrecision), {from: player2});
        await canvasTokenInst.approve(LibertyNFT.address, web3.utils.toBN(1e8).mul(tokenPrecision), {from: player3});
    });
    it('Test Mint NFT', async () => {
        const deployerAccount = accounts[0];
        const feeAddr = accounts[1];

        const player0 = accounts[2];
        const player1 = accounts[3];
        const player2 = accounts[4];
        const player3 = accounts[5];

        const pixelTokenInst = await Pixel.deployed();
        const canvasTokenInst = await Canvas.deployed();
        const libertyNFTInst = await LibertyNFT.deployed();

        const beforeMintBalance = await pixelTokenInst.balanceOf(feeAddr);

        await libertyNFTInst.enableIndex(0, {from: deployerAccount});
        await libertyNFTInst.mint(player0, "test token url", 0, 10, 10, 10, 10, {from: player0, gas: 4700000});

        const afterMintBalance = await pixelTokenInst.balanceOf(feeAddr);
        assert.equal(afterMintBalance.sub(beforeMintBalance).toString(), web3.utils.toBN(10).mul(tokenPrecision), "wrong balance change");

        let liberty = await libertyNFTInst.nftLibertyMap(1);
        assert.equal(liberty.index.toString(), "0", "wrong liberty index");
        assert.equal(liberty.startX.toString(), "10", "wrong liberty startX");
        assert.equal(liberty.startY.toString(), "10", "wrong liberty startY");
        assert.equal(liberty.xLength.toString(), "10", "wrong liberty xLength");
        assert.equal(liberty.yLength.toString(), "10", "wrong liberty yLength");

        assert.equal(liberty.blur, false, "wrong liberty blur");
        assert.equal(liberty.govCounter.toString(), "0", "wrong liberty govCounter");
        assert.equal(liberty.unsafe, false, "wrong liberty unsafe");

        try {
            await libertyNFTInst.mint(player0, "test token url", 0, 10, 10, 10, 10, {from: player0, gas: 4700000});
            assert.fail();
        } catch (error) {
            assert.ok(error.toString().includes("pixel overlap"));
        }

        try {
            await libertyNFTInst.mint(player0, "test token url", 0, 0, 0, 20, 20, {from: player0, gas: 4700000});
            assert.fail();
        } catch (error) {
            assert.ok(error.toString().includes("pixel overlap"));
        }

        try {
            await libertyNFTInst.mint(player0, "test token url", 1, 0, 0, 20, 20, {from: player0, gas: 4700000});
            assert.fail();
        } catch (error) {
            assert.ok(error.toString().includes("index is not enabled yet"));
        }

        // test mint a big liberty
        await libertyNFTInst.mint(player0, "test token url", 0, 20, 20, 200, 200, {from: player0, gas: 10000000});
    });
    it('Test set NFT', async () => {
        const adminAccount = accounts[0];
        const govAccount = accounts[0];
        const feeAddr = accounts[1];

        const player0 = accounts[2];
        const player1 = accounts[3];
        const player2 = accounts[4];
        const player3 = accounts[5];

        const pixelTokenInst = await Pixel.deployed();
        const canvasTokenInst = await Canvas.deployed();
        const libertyNFTInst = await LibertyNFT.deployed();

        const tokenId = web3.utils.toBN(2);

        const tokenUrl = await libertyNFTInst.tokenURI(tokenId);
        assert.equal(tokenUrl, "test token url", "wrong token url");

        let liberty = await libertyNFTInst.nftLibertyMap(tokenId);
        assert.equal(liberty.blur, false, "wrong liberty blur");

        await libertyNFTInst.setTokenURI(tokenId, "new token url", true, {from: player0});

        const newTokenUrl = await libertyNFTInst.tokenURI(tokenId);
        assert.equal(newTokenUrl, "new token url", "wrong token url");

        liberty = await libertyNFTInst.nftLibertyMap(tokenId);
        assert.equal(liberty.blur, true, "wrong liberty blur");

        await libertyNFTInst.setTokenURI(tokenId, "test token url", false, {from: player0});

        await libertyNFTInst.blurNFT(tokenId, {from: govAccount});

        liberty = await libertyNFTInst.nftLibertyMap(tokenId);
        assert.equal(liberty.blur, true, "wrong liberty blur");
        assert.equal(liberty.unsafe, false, "wrong liberty blur");

        for(let i=0; i<100; i++) {
            await libertyNFTInst.blurNFT(tokenId, {from: govAccount});
        }

        liberty = await libertyNFTInst.nftLibertyMap(tokenId);
        assert.equal(liberty.blur, true, "wrong liberty blur");
        assert.equal(liberty.unsafe, true, "wrong liberty blur");

        await libertyNFTInst.resetNFT(tokenId, {from: adminAccount});

        liberty = await libertyNFTInst.nftLibertyMap(tokenId);
        assert.equal(liberty.blur, false, "wrong liberty blur");
        assert.equal(liberty.unsafe, false, "wrong liberty blur");

        await libertyNFTInst.burn(tokenId, {from: player0});
    });

    it('Test manage LibertyNFT', async () => {
        const adminAccount = accounts[0];
        const govAccount = accounts[0];
        const feeAddr = accounts[1];
        const newFeeAddr = accounts[6];

        const player0 = accounts[2];
        const player1 = accounts[3];
        const player2 = accounts[4];
        const player3 = accounts[5];

        const pixelTokenInst = await Pixel.deployed();
        const canvasTokenInst = await Canvas.deployed();
        const libertyNFTInst = await LibertyNFT.deployed();

        const oldMintFeeAmount = await libertyNFTInst.mintFeeAmount();
        const oldModifyFeeAmount = await libertyNFTInst.modifyFeeAmount();
        assert.equal(oldMintFeeAmount.toString(), web3.utils.toBN(1e18).mul(web3.utils.toBN(10)).toString(), "wrong mintFeeAmount");
        assert.equal(oldModifyFeeAmount.toString(), web3.utils.toBN(1e18).toString(), "wrong modifyFeeAmount");

        await libertyNFTInst.setMintFeeAmount(web3.utils.toBN(1e18), {from: adminAccount});
        await libertyNFTInst.setModifyFeeAmount(web3.utils.toBN(1e17), {from: adminAccount});

        const newMintFeeAmount = await libertyNFTInst.mintFeeAmount();
        const newModifyFeeAmount = await libertyNFTInst.modifyFeeAmount();
        assert.equal(newMintFeeAmount.toString(), web3.utils.toBN(1e18).toString(), "wrong mintFeeAmount");
        assert.equal(newModifyFeeAmount.toString(), web3.utils.toBN(1e17).toString(), "wrong modifyFeeAmount");


        const oldBaseURI = await libertyNFTInst.baseURI()
        assert.equal(oldBaseURI, "", "wrong baseURI");

        await libertyNFTInst.setBaseURI("ipfs://",{from: adminAccount});

        const newBaseURI = await libertyNFTInst.baseURI()
        assert.equal(newBaseURI, "ipfs://", "wrong baseURI");

        const oldFeeAddr = await libertyNFTInst.feeAddr()
        assert.equal(oldFeeAddr, feeAddr, "wrong baseURI");

        await libertyNFTInst.transferFeeAddress(newFeeAddr, {from: feeAddr});

        const newFeeAddr1 = await libertyNFTInst.feeAddr()
        assert.equal(newFeeAddr1, newFeeAddr, "wrong baseURI");

        await libertyNFTInst.pause({from: adminAccount});

        try {
            await libertyNFTInst.mint(player0, "test token url", 0, 20, 20, 200, 200, {from: player0, gas: 10000000});
            assert.fail();
        } catch (error) {
            assert.ok(error.toString().includes("token transfer while paused "));
        }

        await libertyNFTInst.unpause({from: adminAccount});

        await libertyNFTInst.mint(player0, "test token url", 0, 20, 20, 200, 200, {from: player0, gas: 10000000});
    });
});