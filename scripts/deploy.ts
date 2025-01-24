 import { ethers } from 'hardhat'
import { KOBE, Airdrop } from '../typechain-types'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'

async function main() {
    let owner: SignerWithAddress
    let token: KOBE
    let airdrop: Airdrop

    // Get deployer account
    [owner] = await ethers.getSigners()
    console.log('Deploying contracts with account:', owner.address)

    // Get initial balance
    const balance = await ethers.provider.getBalance(owner.address)
    console.log('Account balance:', ethers.formatEther(balance))

    try {
        // Deploy Token contract
        const KOBE_Token = await ethers.getContractFactory('KOBE')
        token = await KOBE_Token.deploy(
            'Kobe Bryant', // Token name
            'KOBE', // Token symbol
            1000000000n // Initial supply (1 billion)
        )
        await token.waitForDeployment()
        console.log('KOBE Token deployed to:', await token.getAddress())

        // Create a random wallet for signing airdrop claims
        const wallet = ethers.Wallet.createRandom()
        console.log('Airdrop signer address:', wallet.address)

        // Deploy Airdrop contract
        const Airdrop = await ethers.getContractFactory('Airdrop')
        airdrop = await Airdrop.deploy(
            await token.getAddress(), // Token contract address
            ethers.parseEther('100'), // Amount each address can claim (100 tokens)
            wallet.address // Signer address
        )
        await airdrop.waitForDeployment()
        console.log('Airdrop contract deployed to:', await airdrop.getAddress())

        // Transfer tokens to airdrop contract
        const airdropAmount = ethers.parseEther('10000') // Transfer 10000 tokens for airdrop
        const transferTx = await token.transfer(await airdrop.getAddress(), airdropAmount)
        await transferTx.wait()
        console.log('Transferred', ethers.formatEther(airdropAmount), 'tokens to airdrop contract')

        // Verify contract addresses
        console.log('\nContract Addresses:')
        console.log('--------------------')
        console.log('KOBE Token:', await token.getAddress())
        console.log('Airdrop:', await airdrop.getAddress())
        console.log('Airdrop Signer:', wallet.address)
        console.log('Airdrop Signer Private Key:', wallet.privateKey)
    } catch (error) {
        console.error('Deployment failed:', error)
        process.exitCode = 1
        return
    }

    // Log deployment success
    console.log('\nDeployment completed successfully!')
}

// Execute deployment
main().catch((error) => {
    console.error('Deployment failed:', error)
    process.exitCode = 1
})