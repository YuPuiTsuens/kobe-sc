const { ethers } = require('ethers')
require('dotenv').config()

// 合约地址
const AIRDROP_ADDRESS = '0x146Ca98CBb8915413a1CEbDC60386B404F81D258'
const TOKEN_ADDRESS = '0x...' // KOBE token address

// ABI (只包含我们需要的函数)
const AIRDROP_ABI = [
    'function claimWithSignature(uint256 amount, string calldata profile, uint256 subCount, bytes calldata signature) external',
    'function hasClaimed(address user) external view returns (bool)',
    'function claimedProfiles(string) external view returns (bool)',
    'function signerAddress() external view returns (address)',
]

async function main() {
    // 连接到 BSC 测试网
    const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545')

    // 读取私钥（用于签名交易）
    const privateKey = process.env.PRIVATE_KEY
    const wallet = new ethers.Wallet(privateKey, provider)

    // 创建合约实例
    const airdrop = new ethers.Contract(AIRDROP_ADDRESS, AIRDROP_ABI, wallet)

    // 1. 检查签名者地址
    const signerAddress = await airdrop.signerAddress()
    console.log('Signer Address:', signerAddress)

    // 2. 检查地址是否已领取
    const userAddress = '0x...' // 要检查的地址
    const claimed = await airdrop.hasClaimed(userAddress)
    console.log('Has Claimed:', claimed)

    // 3. 检查 Twitter 账号是否已被使用
    const twitterHandle = 'user123'
    const profileClaimed = await airdrop.claimedProfiles(twitterHandle)
    console.log('Profile Claimed:', profileClaimed)

    // 4. 领取空投示例
    const amount = 100n // 领取数量（不含精度）
    const profile = 'twitter_user123'
    const subCount = amount
    const signature = '0x...' // 从后端获取的签名

    try {
        const tx = await airdrop.claimWithSignature(amount, profile, subCount, signature)
        console.log('Claim Transaction:', tx.hash)
        await tx.wait()
        console.log('Claim successful!')
    } catch (error) {
        console.error('Claim failed:', error)
    }
}

// 使用 web3.js 的交互示例
async function web3Example() {
    const Web3 = require('web3')
    const web3 = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545')

    const airdrop = new web3.eth.Contract(AIRDROP_ABI, AIRDROP_ADDRESS)

    // 检查是否已领取
    const claimed = await airdrop.methods.hasClaimed('0x...').call()
    console.log('Has Claimed:', claimed)

    // 领取空投
    const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY)
    web3.eth.accounts.wallet.add(account)

    const tx = airdrop.methods.claimWithSignature(100, 'twitter_user123', 100, '0x...')
    const gas = await tx.estimateGas({ from: account.address })

    await tx.send({
        from: account.address,
        gas: gas,
    })
}

// 前端 Web3 交互示例 (使用 MetaMask)
async function frontendExample() {
    // 确保已安装 MetaMask
    if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask')
    }

    // 请求连接钱包
    await window.ethereum.request({ method: 'eth_requestAccounts' })

    // 创建 provider 和合约实例
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const airdrop = new ethers.Contract(AIRDROP_ADDRESS, AIRDROP_ABI, signer)

    // 领取空投
    try {
        const amount = 100n
        const profile = 'twitter_user123'
        const subCount = amount
        const signature = '0x...' // 从后端获取的签名

        const tx = await airdrop.claimWithSignature(amount, profile, subCount, signature)
        console.log('Transaction sent:', tx.hash)
        await tx.wait()
        console.log('Claim successful!')
    } catch (error) {
        console.error('Claim failed:', error)
    }
}
