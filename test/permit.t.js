const { expect } = require("chai")
const { ethers } = require("hardhat")

async function getPermitSignature(signer, token, spender, value, deadline) {
  const [nonce, name, version, chainId] = await Promise.all([
    token.nonces(signer.address),
    token.name(),
    "1",
    (await ethers.provider.getNetwork()).chainId,
  ])

  const signature = await signer.signTypedData(
    {
      name,
      version,
      chainId,
      verifyingContract: token.target,
    },
    {
      Permit: [
        {
          name: "owner",
          type: "address",
        },
        {
          name: "spender",
          type: "address",
        },
        {
          name: "value",
          type: "uint256",
        },
        {
          name: "nonce",
          type: "uint256",
        },
        {
          name: "deadline",
          type: "uint256",
        },
      ],
    },
    {
      owner: signer.address,
      spender,
      value,
      nonce,
      deadline,
    }
  )

  const r = signature.slice(0, 66);
  const s = '0x' + signature.slice(66, 130);
  const v = '0x' + signature.slice(130, 132);

  return {
    v,
    r,
    s,
  };
}

describe("ERC20Permit", function () {
  it("ERC20 permit", async function () {
    const accounts = await ethers.getSigners(1)
    const signer = accounts[0]

    const Token = await ethers.getContractFactory("Token")
    const token = await Token.deploy()

    const Vault = await ethers.getContractFactory("Vault")
    const vault = await Vault.deploy(token.target)

    const amount = 1000
    await token.mint(signer.address, amount)

    const deadline = ethers.MaxUint256

    const { v, r, s } = await getPermitSignature(
      signer,
      token,
      vault.target,
      amount,
      deadline
    )

    await expect(vault.deposit(amount)).to.reverted;

    await vault.depositWithPermit(amount, deadline, v, r, s)
    expect(await token.balanceOf(vault.target)).to.equal(amount)
  })
})