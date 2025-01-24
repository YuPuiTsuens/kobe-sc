import { ethers } from 'ethers'

class AirdropSignatureService {
    private signer: ethers.Wallet

    constructor(signerPrivateKey: string) {
        this.signer = new ethers.Wallet(signerPrivateKey)
    }

    /**
     * Get signer address
     * @returns The address of the signer
     */
    public getSignerAddress(): string {
        return this.signer.address
    }

    /**
     * Create signature for airdrop claim
     * @param userAddress The address of the user claiming the airdrop
     * @param amount The amount of tokens to claim
     * @param profile The profile associated with the airdrop
     * @param subCount The subscription count associated with the airdrop
     * @returns Object containing the user address, amount, profile, subCount and signature
     */
    public async createSignature(
        userAddress: string,
        amount: bigint,
        profile: string,
        subCount: bigint
    ): Promise<{
        userAddress: string
        amount: bigint
        profile: string
        subCount: bigint
        signature: string
    }> {
        const messageHash = ethers.solidityPackedKeccak256(['address', 'uint256', 'string', 'uint256'], [userAddress, amount, profile, subCount])

        const signature = await this.signer.signMessage(ethers.getBytes(messageHash))

        return {
            userAddress,
            amount,
            profile,
            subCount,
            signature,
        }
    }

    /**
     * Verify signature
     * @param userAddress The address of the user claiming the airdrop
     * @param amount The amount of tokens to claim
     * @param signature The signature to verify
     * @returns Boolean indicating if the signature is valid
     */
    public async verifySignature(userAddress: string, amount: bigint, signature: string): Promise<boolean> {
        // Create message hash
        const messageHash = ethers.solidityPackedKeccak256(['address', 'uint256'], [userAddress, amount])

        // Recover signer address
        const recoveredAddress = ethers.verifyMessage(ethers.getBytes(messageHash), signature)

        // Check if recovered address matches signer address
        return recoveredAddress === this.signer.address
    }
}

export default AirdropSignatureService
