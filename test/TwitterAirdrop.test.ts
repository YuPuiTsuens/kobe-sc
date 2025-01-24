import { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import { KOBE, Airdrop } from '../typechain-types'
import TwitterAirdropService from '../scripts/twitterService'
import * as dotenv from 'dotenv'

dotenv.config()

describe('Twitter Airdrop Integration', function () {
    let token: KOBE
    let airdrop: Airdrop
    let owner: SignerWithAddress
    let claimer: SignerWithAddress
    let twitterService: TwitterAirdropService

    const TWITTER_API_KEY = process.env.TWITTER_API_KEY || ''

    before(function () {
        if (!TWITTER_API_KEY) {
            this.skip()
        }
    })

    beforeEach(async function () {
        ;[owner, claimer] = await ethers.getSigners()

        // Create service with random signer
        const signerPrivateKey = ethers.Wallet.createRandom().privateKey
        twitterService = new TwitterAirdropService(signerPrivateKey, TWITTER_API_KEY)

        // Deploy contracts
        const Token = await ethers.getContractFactory('KOBE')
        token = await Token.deploy('Kobe Bryant', 'KOBE', 1000000000n)
        await token.waitForDeployment()

        const Airdrop = await ethers.getContractFactory('Airdrop')
        airdrop = await Airdrop.deploy(await token.getAddress(), ethers.parseEther('100'), twitterService.getSignerAddress())
        await airdrop.waitForDeployment()

        // Transfer tokens to airdrop contract
        await token.transfer(await airdrop.getAddress(), ethers.parseEther('1000000'))
    })

    it('Should allow claiming tokens based on Twitter followers', async function () {
        const screenName = 'elonmusk'
        const { profile, subCount, amount, signature } = await twitterService.getTwitterDataAndSignature(await claimer.getAddress(), screenName)
        console.log(profile, subCount, amount, signature)
        await expect(airdrop.connect(claimer).claimWithSignature(amount, profile, subCount, signature))
            .to.emit(airdrop, 'AirdropClaimed')
            .withArgs(await claimer.getAddress(), amount, profile, subCount)
        expect(await token.balanceOf(await claimer.getAddress())).to.equal(amount)
    })
})
