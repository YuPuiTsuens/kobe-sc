import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomicfoundation/hardhat-verify'
import 'dotenv/config'

const config: HardhatUserConfig = {
    solidity: '0.8.28',
    networks: {
        // hardhat: {
        //     accounts: process.env.AIRDROP_SIGNER_PRIVATE_KEY
        //         ? [{ privateKey: `0x${process.env.AIRDROP_SIGNER_PRIVATE_KEY}`, balance: '10000000000000000000000' }]
        //         : undefined,
        // },
        bsc: {
            url: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
            accounts: process.env.AIRDROP_SIGNER_PRIVATE_KEY ? [process.env.AIRDROP_SIGNER_PRIVATE_KEY] : [],
            chainId: 56,
        },
        bscTestnet: {
            url: 'https://bsc-testnet-rpc.publicnode.com',
            accounts: process.env.AIRDROP_SIGNER_PRIVATE_KEY ? [process.env.AIRDROP_SIGNER_PRIVATE_KEY] : [],
            chainId: 97,
        },
    },
    etherscan: {
        apiKey: {
            bsc: process.env.BSCSCAN_API_KEY || '',
            bscTestnet: process.env.BSCSCAN_API_KEY || '',
        },
    },
}

export default config
