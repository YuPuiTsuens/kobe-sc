import express from 'express'
import { ethers } from 'ethers'
import dotenv from 'dotenv'
import cors from 'cors'

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors())

// 签名者私钥
const SIGNER_PRIVATE_KEY = process.env.AIRDROP_SIGNER_PRIVATE_KEY
if (!SIGNER_PRIVATE_KEY) {
    throw new Error('AIRDROP_SIGNER_PRIVATE_KEY is required')
}

// 创建签名者
const signer = new ethers.Wallet(SIGNER_PRIVATE_KEY)

interface TwitterUser {
    screenName: string
    followers: number
}

// 模拟Twitter API调用
async function getTwitterUser(screenName: string): Promise<TwitterUser> {
    // 这里应该是实际的Twitter API调用
    // 现在先返回模拟数据
    return {
        screenName,
        followers: Math.floor(Math.random() * 1000), // 随机粉丝数
    }
}

// 计算可领取的代币数量（基于粉丝数）
function calculateAirdropAmount(followers: number): bigint {
    // 示例：每个粉丝可以获得 0.1 个代币
    const baseAmount = ethers.parseEther('0.1')
    return baseAmount * BigInt(followers)
}

app.post('/api/airdrop/sign', async (req, res) => {
    try {
        const { address, screenName } = req.body

        // 验证参数
        if (!address || !screenName) {
            return res.status(400).json({ error: 'address and screenName are required' })
        }

        // 验证地址格式
        if (!ethers.isAddress(address)) {
            return res.status(400).json({ error: 'Invalid address format' })
        }

        // 获取Twitter用户信息
        const twitterUser = await getTwitterUser(screenName)

        // 计算可领取数量
        const amount = calculateAirdropAmount(twitterUser.followers)

        // 创建消息哈希
        const messageHash = ethers.solidityPackedKeccak256(['address', 'uint256', 'string', 'uint256'], [address, amount, screenName, amount])

        // 签名
        const signature = await signer.signMessage(ethers.getBytes(messageHash))

        // 返回结果
        res.json({
            success: true,
            data: {
                address,
                amount: amount.toString(),
                profile: screenName,
                subCount: amount.toString(),
                signature,
            },
        })
    } catch (error) {
        console.error('Error processing request:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
