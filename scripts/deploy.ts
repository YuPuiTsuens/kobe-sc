import { ethers, run } from 'hardhat'
import { KOBE, Airdrop } from '../typechain-types'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'

async function main() {
    let owner: SignerWithAddress
    let token: KOBE
    let airdrop: Airdrop
    ;[owner] = await ethers.getSigners()

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
        const tokenAddress = await token.getAddress()
        console.log('KOBE Token deployed to:', tokenAddress)

        // Deploy Airdrop contract
        const Airdrop = await ethers.getContractFactory('Airdrop')
        airdrop = await Airdrop.deploy(
            tokenAddress, // Token contract address
            ethers.parseEther('100'), // Amount each address can claim (100 tokens)
            owner.address // Signer address
        )
        await airdrop.waitForDeployment()
        const airdropAddress = await airdrop.getAddress()
        console.log('Airdrop contract deployed to:', airdropAddress)

        // Transfer tokens to airdrop contract
        const airdropAmount = ethers.parseEther('10000') // Transfer 10000 tokens for airdrop
        const transferTx = await token.transfer(airdropAddress, airdropAmount)
        await transferTx.wait()
        console.log('Transferred', ethers.formatEther(airdropAmount), 'tokens to airdrop contract')

        // Verify contract addresses
        console.log('\nContract Addresses:')
        console.log('--------------------')
        console.log('KOBE Token:', tokenAddress)
        console.log('Airdrop:', airdropAddress)
        console.log('Airdrop Signer:', owner.address)

        // Wait for block confirmations
        console.log('Waiting for block confirmations...')
        await airdrop.deploymentTransaction()?.wait(6) // Wait for 6 block confirmations

        // Verify KOBE Token contract
        console.log('Starting KOBE Token contract verification...')
        try {
            await run('verify:verify', {
                address: tokenAddress,
                constructorArguments: [
                    'Kobe Bryant', // Token name
                    'KOBE', // Token symbol
                    1000000000n, // Initial supply
                ],
            })
            console.log('KOBE Token contract verification successful')
        } catch (error: any) {
            if (error?.message?.includes('Already Verified')) {
                console.log('KOBE Token contract is already verified!')
            } else {
                console.log('Error verifying KOBE Token contract:', error)
            }
        }

        // Verify Airdrop contract
        console.log('Starting Airdrop contract verification...')
        try {
            await run('verify:verify', {
                address: airdropAddress,
                constructorArguments: [
                    tokenAddress, // Token contract address
                    ethers.parseEther('100'), // Amount each address can claim
                    owner.address, // Signer address
                ],
            })
            console.log('Airdrop contract verification successful')
        } catch (error: any) {
            if (error?.message?.includes('Already Verified')) {
                console.log('Airdrop contract is already verified!')
            } else {
                console.log('Error verifying Airdrop contract:', error)
            }
        }
    } catch (error) {
        console.error('Deployment failed:', error)
        process.exitCode = 1
        return
    }

    // Log deployment success
    console.log('\nDeployment completed successfully!')
}

// Execute deployment
main().catch(error => {
    console.error('Deployment failed:', error)
    process.exitCode = 1
})
