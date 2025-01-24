# KOBE Token Airdrop Project

This project includes the KOBE token contract, airdrop contract, and supporting backend services.

## Project Structure

### Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

```
.
├── contracts/                # Smart contracts
│   ├── KOBE.sol              # KOBE token contract
│   └── Airdrop.sol           # Airdrop contract
├── scripts/                  # Deployment scripts
│   └── deploy.ts             # Contract deployment script
├── src/                      # Backend services
│   └── server.js             # Express server
├── test/                     # Test files
│   └── index.test.ts         # Contract tests
└── examples/                 # Example code
    └── interact.js           # Contract interaction example
```

## Environment Requirements

- Node.js >= 16
- npm >= 8
- Hardhat
- BSC Testnet/Mainnet node access

## Installation

1. Install dependencies:

```shell
npm install
```

2. Compile contracts:

```shell
npx hardhat compile
```

## Configuration

Create a `.env` file and set the following environment variables:

### Contract Deployment and Signing

```env
AIRDROP_SIGNER_PRIVATE_KEY=your_private_key
BSC_RPC_URL=your_bsc_rpc_url
BSCSCAN_API_KEY=your_bscscan_api_key
```

### Twitter API

```env
TWITTER_API_KEY=your_twitter_api_key
```

### Server Configuration

```env
PORT=3000
```

## Contract Deployment

1. Deploy to Testnet:

```bash
npx hardhat run scripts/deploy.ts --network bscTestnet
```

2. Deploy to Mainnet:

```bash
npx hardhat run scripts/deploy.ts --network bsc
```

After deployment, the following will be output:

- KOBE Token Address
- Airdrop Contract Address
- Signer Address

## Contract Verification

### Verify KOBE Token

```bash
npx hardhat verify --network bscTestnet <token_address> "Kobe Bryant" "KOBE" 1000000000
```

### Verify Airdrop Contract

```bash
npx hardhat verify --network bscTestnet <airdrop_address> <token_address> <signer_address>
```

## Backend Service Deployment

1. Install dependencies:

```bash
npm i
```

2. Start the server:

```bash
node src/server.js
```

The server will run on the configured port (default 3000).

## API Endpoints

### 1. Get Signature Data

`GET /api/airdrop/sign?address={wallet_address}&screenName={twitter_username}`

Response:

```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "amount": "100",
    "profile": "twitter_user123",
    "subCount": "100",
    "signature": "0x..."
  }
}
```

### 2. Get Signer Address

`GET /api/airdrop/signer`

Response:

```json
{
  "success": true,
  "data": {
    "signerAddress": "0x..."
  }
}
```

## Contract Interaction

### Using ethers.js

```javascript
const { ethers } = require('ethers')
// Connect to BSC Testnet
const provider = new ethers.JsonRpcProvider('<https://data-seed-prebsc-1-s1.binance.org:8545>')
const wallet = new ethers.Wallet(privateKey, provider)
// Create contract instance
const airdrop = new ethers.Contract(AIRDROP_ADDRESS, AIRDROP_ABI, wallet)
// Claim airdrop
const tx = await airdrop.claimWithSignature(amount, profile, subCount, signature)
await tx.wait()
```

### Using Web3.js

```javascript
const Web3 = require('web3')
const web3 = new Web3('<https://data-seed-prebsc-1-s1.binance.org:8545>')
const airdrop = new web3.eth.Contract(AIRDROP_ABI, AIRDROP_ADDRESS)
const tx = airdrop.methods.claimWithSignature(amount, profile, subCount, signature)
```

## Testing

Run contract tests:

```bash
npx hardhat test
```

## BSC Testnet Configuration

- RPC URL: `<https://data-seed-prebsc-1-s1.binance.org:8545>`
- Chain ID: 97
- Explorer: `<https://testnet.bscscan.com>`
- Get Testnet BNB: `<https://testnet.binance.org/faucet-smart>`

## Security Considerations

1. **Private Key Security**
   - Never hardcode private keys in the code
   - Use environment variables to store sensitive information
   - Use a secure key management system in production

2. **Contract Security**
   - Thoroughly test contracts before deployment
   - Consider using multi-sig wallets for contract management
   - Implement appropriate access control

3. **API Security**
   - Implement rate limiting
   - Add proper API authentication
   - Validate all user inputs

## Production Deployment Recommendations

1. Use PM2 to manage Node.js processes:

```bash
npm install -g pm2
pm2 start src/server.js
```

2. Set up NGINX reverse proxy
3. Enable HTTPS
4. Implement monitoring and logging
5. Set up automatic backups

## Troubleshooting

1. **Contract Interaction Failures**
   - Check wallet balance (BNB required for gas)
   - Verify the signature is correct
   - Ensure the transaction parameters are formatted correctly

2. **Server Issues**
   - Check log files
   - Verify environment variable configurations
   - Ensure network connectivity

## License

MIT
