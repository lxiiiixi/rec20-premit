const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("VerifySignature", function () {
    it("Check signature", async function () {
        const [signer, to] = await ethers.getSigners(2)

        const VerifySignature = await ethers.getContractFactory("VerifySignature")
        const contract = await VerifySignature.deploy()

        const amount = 100
        const message = "Hello"
        const nonce = 123

        const hash = await contract.getMessageHash(to.address, amount, message, nonce)
        const sig = await signer.signMessage(ethers.toBeArray(hash))

        const ethHash = await contract.getEthSignedMessageHash(hash)

        console.log("signer          ", signer.address)
        console.log("recovered signer", await contract.recoverSigner(ethHash, sig))

        // Correct signature and message returns true
        expect(
            await contract.verify(signer.address, to.address, amount, message, nonce, sig)
        ).to.equal(true)

        // Incorrect message returns false
        expect(
            await contract.verify(signer.address, to.address, amount + 1, message, nonce, sig)
        ).to.equal(false)
    })
})