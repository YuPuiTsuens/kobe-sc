import { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import { KOBE, Airdrop } from '../typechain-types'

describe('KOBE Token and Airdrop', function () {
    let token: KOBE
    let airdrop: Airdrop
    let owner: SignerWithAddress
    let signer: SignerWithAddress
    let user1: SignerWithAddress
    let user2: SignerWithAddress

    const initialSupply = 1000000000n // 1 billion
    const name = 'Kobe Bryant'
    const symbol = 'KOBE'

    beforeEach(async function () {
        // Get signers
        const signers = await ethers.getSigners()
        owner = signers[0]
        signer = signers[1]
        user1 = signers[2]
        user2 = signers[3]

        // Deploy KOBE token
        const KOBE = await ethers.getContractFactory('KOBE')
        token = await KOBE.deploy(name, symbol, initialSupply)
        await token.waitForDeployment()

        // Deploy Airdrop contract
        const Airdrop = await ethers.getContractFactory('Airdrop')
        airdrop = await Airdrop.deploy(await token.getAddress(), signer.address)
        await airdrop.waitForDeployment()

        // Transfer tokens to airdrop contract (10 million tokens)
        await token.transfer(await airdrop.getAddress(), ethers.parseEther('10000000'))
    })

    describe('KOBE Token', function () {
        it('Should set the correct token name and symbol', async function () {
            expect(await token.name()).to.equal(name)
            expect(await token.symbol()).to.equal(symbol)
        })

        it('Should assign the total supply of tokens to the owner', async function () {
            const ownerBalance = await token.balanceOf(owner.address)
            expect(await token.totalSupply()).to.equal(ownerBalance + ethers.parseEther('10000000'))
        })

        it('Should transfer tokens between accounts', async function () {
            const amount = 100n // 100 tokens
            await token.transfer(user1.address, amount * 10n ** 18n)
            expect(await token.balanceOf(user1.address)).to.equal(amount * 10n ** 18n)
        })

        it('Should fail if sender does not have enough tokens', async function () {
            const initialBalance = await token.balanceOf(user1.address)
            await expect(token.connect(user1).transfer(user2.address, ethers.parseEther('1'))).to.be.reverted
            expect(await token.balanceOf(user1.address)).to.equal(initialBalance)
        })
    })

    describe('Airdrop', function () {
        describe('Deployment', function () {
            it('Should set the correct token address', async function () {
                expect(await airdrop.token()).to.equal(await token.getAddress())
            })

            it('Should set the correct signer address', async function () {
                expect(await airdrop.signerAddress()).to.equal(signer.address)
            })
        })

        describe('Claim', function () {
            it('Should allow claiming with valid signature', async function () {
                const amount = 100n // 100 tokens without decimals
                const profile = 'twitter_user1'
                const subCount = amount

                // Create signature
                const messageHash = ethers.solidityPackedKeccak256(
                    ['address', 'uint256', 'string', 'uint256'],
                    [user1.address, amount, profile, subCount]
                )
                const signature = await signer.signMessage(ethers.getBytes(messageHash))

                // Check initial balance
                const initialBalance = await token.balanceOf(user1.address)

                // Claim tokens
                await airdrop.connect(user1).claimWithSignature(amount, profile, subCount, signature)

                // Verify claim
                expect(await token.balanceOf(user1.address)).to.equal(initialBalance + amount * 10n ** 18n)
                expect(await airdrop.hasClaimed(user1.address)).to.be.true
                expect(await airdrop.claimedProfiles(profile)).to.be.true
            })

            it('Should fail when claiming with invalid signature', async function () {
                const amount = 100n // 100 tokens without decimals
                const profile = 'twitter_user1'
                const subCount = amount

                // Create signature with wrong signer
                const messageHash = ethers.solidityPackedKeccak256(
                    ['address', 'uint256', 'string', 'uint256'],
                    [user1.address, amount, profile, subCount]
                )
                const signature = await user2.signMessage(ethers.getBytes(messageHash))

                await expect(airdrop.connect(user1).claimWithSignature(amount, profile, subCount, signature)).to.be.revertedWith('Invalid signature')
            })

            it('Should fail when claiming twice', async function () {
                const amount = 100n // 100 tokens without decimals
                const profile = 'twitter_user1'
                const subCount = amount

                const messageHash = ethers.solidityPackedKeccak256(
                    ['address', 'uint256', 'string', 'uint256'],
                    [user1.address, amount, profile, subCount]
                )
                const signature = await signer.signMessage(ethers.getBytes(messageHash))

                // First claim should succeed
                await airdrop.connect(user1).claimWithSignature(amount, profile, subCount, signature)

                // Second claim should fail
                await expect(airdrop.connect(user1).claimWithSignature(amount, profile, subCount, signature)).to.be.revertedWith('Already claimed')
            })

            it('Should fail when profile is already claimed', async function () {
                const amount = 100n // 100 tokens without decimals
                const profile = 'twitter_user1'
                const subCount = amount

                // Create signatures for both users
                const messageHash1 = ethers.solidityPackedKeccak256(
                    ['address', 'uint256', 'string', 'uint256'],
                    [user1.address, amount, profile, subCount]
                )
                const signature1 = await signer.signMessage(ethers.getBytes(messageHash1))

                const messageHash2 = ethers.solidityPackedKeccak256(
                    ['address', 'uint256', 'string', 'uint256'],
                    [user2.address, amount, profile, subCount]
                )
                const signature2 = await signer.signMessage(ethers.getBytes(messageHash2))

                // First claim should succeed
                await airdrop.connect(user1).claimWithSignature(amount, profile, subCount, signature1)

                // Second claim with same profile should fail
                await expect(airdrop.connect(user2).claimWithSignature(amount, profile, subCount, signature2)).to.be.revertedWith(
                    'Profile already claimed'
                )
            })

            it('Should fail when amount does not match subCount', async function () {
                const amount = 100n // 100 tokens without decimals
                const profile = 'twitter_user1'
                const subCount = 50n // Different from amount

                const messageHash = ethers.solidityPackedKeccak256(
                    ['address', 'uint256', 'string', 'uint256'],
                    [user1.address, amount, profile, subCount]
                )
                const signature = await signer.signMessage(ethers.getBytes(messageHash))

                await expect(airdrop.connect(user1).claimWithSignature(amount, profile, subCount, signature)).to.be.revertedWith(
                    'Amount must match sub count'
                )
            })
        })

        describe('Admin functions', function () {
            it('Should allow owner to update signer address', async function () {
                await airdrop.connect(owner).setSignerAddress(user2.address)
                expect(await airdrop.signerAddress()).to.equal(user2.address)
            })

            it('Should allow owner to withdraw tokens', async function () {
                const amount = 1000n // 1000 tokens
                const initialBalance = await token.balanceOf(owner.address)

                await airdrop.connect(owner).withdrawTokens(amount * 10n ** 18n)

                expect(await token.balanceOf(owner.address)).to.equal(initialBalance + amount * 10n ** 18n)
            })

            it('Should not allow non-owner to withdraw tokens', async function () {
                const amount = 1000n // 1000 tokens
                await expect(airdrop.connect(user1).withdrawTokens(amount * 10n ** 18n)).to.be.revertedWithCustomError(
                    airdrop,
                    'OwnableUnauthorizedAccount'
                )
            })
        })
    })
})
