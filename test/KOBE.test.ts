import { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import { KOBE, Airdrop } from '../typechain-types'
import AirdropSignatureService from '../scripts/signatureService'

describe('KOBE Token and Airdrop', function () {
    let token: KOBE
    let airdrop: Airdrop
    let owner: SignerWithAddress
    let addr1: SignerWithAddress
    let addr2: SignerWithAddress
    let addrs: SignerWithAddress[]
    let signatureService: AirdropSignatureService

    const initialSupply = 1000000000n // Initial supply (1 billion)
    const airdropAmount = 100n // Amount each address can claim

    beforeEach(async function () {
        // Get test accounts
        ;[owner, addr1, addr2, ...addrs] = await ethers.getSigners()

        // Create new wallet for signing
        const wallet = ethers.Wallet.createRandom()
        signatureService = new AirdropSignatureService(wallet.privateKey)

        // Deploy Token contract
        const Token = await ethers.getContractFactory('KOBE')
        token = await Token.deploy('Kobe Bryant', 'KOBE', initialSupply)
        await token.waitForDeployment()

        // Deploy Airdrop contract
        const Airdrop = await ethers.getContractFactory('Airdrop')
        airdrop = await Airdrop.deploy(
            await token.getAddress(),
            ethers.parseEther(airdropAmount.toString()),
            await signatureService.getSignerAddress()
        )
        await airdrop.waitForDeployment()

        // Transfer tokens to airdrop contract
        await token.transfer(await airdrop.getAddress(), ethers.parseEther('10000'))
    })

    describe('Token', function () {
        it('Should set the right token name and symbol', async function () {
            expect(await token.name()).to.equal('Kobe Bryant')
            expect(await token.symbol()).to.equal('KOBE')
        })

        it('Should assign the total supply of tokens to the owner', async function () {
            const ownerBalance = await token.balanceOf(owner.address)
            const totalSupply = await token.totalSupply()
            expect(ownerBalance + ethers.parseEther('10000')).to.equal(totalSupply)
        })
    })
})
