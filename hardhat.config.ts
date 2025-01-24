import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const config: HardhatUserConfig = {
    solidity: '0.8.28',
    networks: {
        hardhat: {
            accounts: process.env.AIRDROP_SIGNER_PRIVATE_KEY
                ? [{ privateKey: `0x${process.env.AIRDROP_SIGNER_PRIVATE_KEY}`, balance: '10000000000000000000000' }]
                : undefined,
        },
    },
}

export default config 