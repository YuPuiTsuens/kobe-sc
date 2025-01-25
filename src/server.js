const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const axios = require('axios')
const { ethers } = require('ethers')

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors())

// 初始化签名者
const SIGNER_PRIVATE_KEY = process.env.AIRDROP_SIGNER_PRIVATE_KEY
const TWITTER_API_HOST = 'api.twitter.com'

if (!SIGNER_PRIVATE_KEY) {
    throw new Error('AIRDROP_SIGNER_PRIVATE_KEY is required')
}

const signer = new ethers.Wallet(SIGNER_PRIVATE_KEY)

// 获取Twitter数据
async function getTwitterData(bearerToken) {
    try {
        // 确保 token 不包含 "Bearer " 前缀
        const token = bearerToken.startsWith('Bearer ') ? bearerToken : `Bearer ${bearerToken}`

        const response = await axios.get(`https://${TWITTER_API_HOST}/2/users/me`, {
            params: {
                'user.fields': 'id,name,username,profile_image_url,public_metrics',
                expansions: 'pinned_tweet_id',
            },
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })

        if (!response.data?.data) {
            throw new Error('Invalid Twitter response')
        }

        return {
            profile: response.data.data.username,
            subCount: BigInt(response.data.data.public_metrics.followers_count || 0),
            profileImageUrl: response.data.data.profile_image_url,
        }
    } catch (error) {
        console.error('Twitter API Error:', error)
        throw new Error('Failed to fetch Twitter data')
    }
}

// 创建签名
async function createSignature(address, amount, profile, subCount) {
    try {
        const messageHash = ethers.solidityPackedKeccak256(['address', 'uint256', 'string', 'uint256'], [address, amount, profile, subCount])
        return await signer.signMessage(ethers.getBytes(messageHash))
    } catch (error) {
        console.error('Signature Error:', error)
        throw new Error('Failed to create signature')
    }
}

const signHandler = async (req, res) => {
    try {
        const { address, authorization } = req.query

        // 验证参数
        if (!address || !authorization) {
            return res.status(400).json({
                success: false,
                error: 'address and authorization are required',
            })
        }

        // 验证地址格式
        if (!ethers.isAddress(address)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid address format',
            })
        }

        // 获取Twitter数据
        const twitterData = await getTwitterData(authorization)
        const amount = twitterData.subCount

        // 创建签名
        const signature = await createSignature(address, amount, twitterData.profile, amount)

        res.json({
            success: true,
            data: {
                address,
                amount: amount.toString(),
                profile: twitterData.profile,
                subCount: amount.toString(),
                signature,
                profileImageUrl: twitterData.profileImageUrl,
            },
        })
    } catch (error) {
        console.error('Error processing request:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
        })
    }
}

app.get('/api/airdrop/sign', signHandler)

// 获取签名者地址的接口（用于验证）
app.get('/api/airdrop/signer', (_req, res) => {
    try {
        const signerAddress = signer.address
        res.json({
            success: true,
            data: {
                signerAddress,
            },
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
        })
    }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
    console.log(`Signer address: ${signer.address}`)
})
