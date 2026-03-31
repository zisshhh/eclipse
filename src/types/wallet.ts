
export interface Wallet {
    id: string;
    chain: 'solana' | 'ethereum';
    accountIndex: number
    publicKey: string;
    privateKey: string
    showPrivateKey: boolean;
    balance?: string
}