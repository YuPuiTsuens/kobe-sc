import axios from 'axios'
import AirdropSignatureService from './signatureService'

interface TwitterResponse {
    status: string
    profile: string
    sub_count: number
    // ... other fields if needed
}

class TwitterAirdropService {
    private signatureService: AirdropSignatureService
    private apiKey: string
    private apiHost: string

    constructor(signerPrivateKey: string, apiKey: string) {
        this.signatureService = new AirdropSignatureService(signerPrivateKey)
        this.apiKey = apiKey
        this.apiHost = 'twitter-api45.p.rapidapi.com'
    }

    /**
     * Get Twitter data and create signature for airdrop
     * @param userAddress Ethereum address of the claimer
     * @param screenName Twitter screen name
     * @returns Signature data for claiming airdrop
     */
    public async getTwitterDataAndSignature(
        userAddress: string,
        screenName: string
    ): Promise<{
        profile: string
        subCount: bigint
        amount: bigint
        signature: string
    }> {
        try {
            const config = {
                method: 'get',
                url: `https://${this.apiHost}/screenname.php`,
                params: {
                    screenname: screenName,
                },
                headers: {
                    'x-rapidapi-host': this.apiHost,
                    'x-rapidapi-key': this.apiKey,
                },
            }

            const response = await axios.request<TwitterResponse>(config)
            const { profile, sub_count } = response.data

            // Verify account is active
            if (response.data.status !== 'active') {
                throw new Error('Twitter account is not active')
            }

            // Convert sub_count to bigint for contract interaction
            const subCount = BigInt(sub_count)

            // Create signature (amount equals sub_count)
            const { signature } = await this.signatureService.createSignature(userAddress, subCount, profile, subCount)
            console.log(profile, subCount, subCount, signature)

            return {
                profile,
                subCount,
                amount: subCount,
                signature,
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Twitter API error: ${error}`)
            }
            throw error
        }
    }

    /**
     * Get signer address for contract deployment
     */
    public getSignerAddress(): string {
        return this.signatureService.getSignerAddress()
    }
}

export default TwitterAirdropService
