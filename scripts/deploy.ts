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

        // Verify contracts
        console.log('\nWaiting for block confirmations...')
        await airdrop.deploymentTransaction()?.wait(6)

        // Verify KOBE Token
        console.log('Verifying KOBE Token...')
        try {
            await run('verify:verify', {
                address: tokenAddress,
                constructorArguments: ['Kobe Bryant', 'KOBE', 1000000000n],
            })
        } catch (error: any) {
            if (error?.message?.includes('Already Verified')) {
                console.log('KOBE Token already verified')
            } else {
                console.log('Error verifying KOBE Token:', error)
            }
        }

        // Verify Airdrop
        console.log('Verifying Airdrop...')
        try {
            await run('verify:verify', {
                address: airdropAddress,
                constructorArguments: [tokenAddress, owner.address],
            })
        } catch (error: any) {
            if (error?.message?.includes('Already Verified')) {
                console.log('Airdrop already verified')
            } else {
                console.log('Error verifying Airdrop:', error)
            }
        }

        console.log('\nDeployment completed successfully!')
        console.log('KOBE Token:', tokenAddress)
        console.log('Airdrop:', airdropAddress)
        console.log('Signer:', owner.address)
    } catch (error) {
        console.error('Deployment failed:', error)
        process.exitCode = 1
    }
}

main().catch(error => {
    console.error('Deployment failed:', error)
    process.exitCode = 1
})
