const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const { ethers } = require('ethers')
const axios = require('axios')

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors())

// 初始化签名者
const SIGNER_PRIVATE_KEY = process.env.AIRDROP_SIGNER_PRIVATE_KEY
const TWITTER_API_KEY = process.env.TWITTER_API_KEY
const TWITTER_API_HOST = 'twitter-api45.p.rapidapi.com'

if (!SIGNER_PRIVATE_KEY || !TWITTER_API_KEY) {
    throw new Error('AIRDROP_SIGNER_PRIVATE_KEY and TWITTER_API_KEY are required')
}

const signer = new ethers.Wallet(SIGNER_PRIVATE_KEY)

// 获取Twitter数据
async function getTwitterData(screenName) {
    try {
        const response = await axios.get(`https://${TWITTER_API_HOST}/screenname.php`, {
            params: { screenname: screenName },
            headers: {
                'x-rapidapi-host': TWITTER_API_HOST,
                'x-rapidapi-key': TWITTER_API_KEY,
            },
        })

        if (response.data.status !== 'active') {
            throw new Error('Twitter account is not active')
        }

        return {
            profile: response.data.profile,
            subCount: BigInt(response.data.sub_count),
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
        const { address, screenName } = req.query

        // 验证参数
        if (!address || !screenName) {
            return res.status(400).json({
                success: false,
                error: 'address and screenName are required',
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
        const { profile, subCount } = await getTwitterData(screenName)

        // 创建签名
        const signature = await createSignature(address, subCount, profile, subCount)

        res.json({
            success: true,
            data: {
                address,
                amount: subCount.toString(),
                profile,
                subCount: subCount.toString(),
                signature,
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
