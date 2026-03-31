import { useEffect, useState } from "react"
import type { Wallet } from "./types/wallet"
import { mnemonicToSeed } from "bip39";
import { derivePath } from "ed25519-hd-key"
import nacl from "tweetnacl"
import bs58 from "bs58"
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

const ALCHEMY_RPC_URL = process.env.ALCHEMY_RPC_URL as string;
console.log(ALCHEMY_RPC_URL);

export const MultiChainWallet = ({ mnemonic }: { mnemonic: string }) => {
    const [wallets, setWallets] = useState<Wallet[]>([])
    const [selectedWalletIndex, setSelectedWalletIndex] = useState(0);
    const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
    const [activeChain, setActiveChain] = useState<'solana' | 'ethereum'>('solana');
    const [loading, setLoading] = useState(false);
    const [sendForm, setSendForm] = useState({ to: '', amount: '' });

    useEffect(() => {
        const savedWallet = localStorage.getItem('multiChainWalltes');
        if (savedWallet) {
            const parsed = JSON.parse(savedWallet);
            setWallets(parsed);
        }
    }, [])

    useEffect(() => {
        localStorage.setItem('multiChainWallets', JSON.stringify(wallets))
    }, [wallets])

    const addNewWallet = async () => {
        setLoading(true);
        try {
            let newWallet!: Wallet;

            if (newWallet.chain === "solana") {
                const seed = mnemonicToSeed(mnemonic);
                const path = `m/44'/501'/${selectedWalletIndex}'/0'`;

                const { key } = derivePath(path, (await seed).toString('hex'));
                const keypair = nacl.sign.keyPair.fromSeed(key);

                newWallet = {
                    id: Date.now().toString(),
                    chain: "solana",
                    accountIndex: selectedWalletIndex,
                    publicKey: bs58.encode(keypair.publicKey),
                    privateKey: Buffer.from(keypair.secretKey).toString('hex'),
                    showPrivateKey: false
                };
            } else {
                //have to write ethereum
            }
            setWallets(prev => [...prev, newWallet]);
            setSelectedWalletIndex(prev => prev + 1);

        } catch (e) {
            console.log(e);
            alert('Failed to generate wallet')
        }
        setLoading(false);
    };

    const togglePrivateKey = (walletId: string) => {
        setWallets((prevWallets) =>
            prevWallets.map((wallet) =>
                wallet.id === walletId
                    ? { ...wallet, showPrivateKey: !wallet.showPrivateKey }
                    : wallet
            )
        );

        setSelectedWallet((prevSelected) =>
            prevSelected && prevSelected.id === walletId
                ? { ...prevSelected, showPrivateKey: !prevSelected.showPrivateKey }
                : prevSelected
        );
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('copied to clipboard!')
    }

    const fetchBalance = async (wallet: Wallet) => {
        try {
            if (wallet.chain === "solana") {
                const connection = new Connection(ALCHEMY_RPC_URL);
                const balance = await connection.getBalance(new PublicKey(wallet.publicKey));
                const solBalance = (balance / LAMPORTS_PER_SOL).toFixed(4);

                setWallets(prev => prev.map(w =>
                    w.id === wallet.id ? { ...w, balance: `${solBalance} SOL` } : w
                ));
            } else {
                //write for ethereum
            }
        } catch (e) {
            console.log(e);
            alert("Failed to fetch balance");
        }
    }

    const sendTransection = async () => {
        if (!selectedWallet || !sendForm.to || sendForm.amount) return;
        setLoading(true);

        try {
            if (selectedWallet.chain === "solana") {
                const connection = new Connection(ALCHEMY_RPC_URL);

                const fromKeypair = Keypair.fromSecretKey(
                    Uint8Array.from(Buffer.from(selectedWallet.privateKey, 'hex'))
                )

                const transection = new Transaction().add(
                    SystemProgram.transfer({
                        fromPubkey: fromKeypair.publicKey,
                        toPubkey: new PublicKey(sendForm.to),
                        lamports: parseFloat(sendForm.amount) * LAMPORTS_PER_SOL
                    })
                );

                const signature = await connection.sendTransaction(transection, [fromKeypair]);
                await connection.confirmTransaction(signature, 'confirmed');
                alert(`Transection Succesfull\nSignature: ${signature}`);
            } else {
                // write for eth
            }

            fetchBalance(selectedWallet);
            setSendForm({ to: '', amount: '' });
            setSelectedWallet(null);
        } catch (e) {
            console.log(e);
            alert("Transection failed");
        }
        setLoading(false);
    }

    const filteredWallets = wallets.filter(w => w.chain === activeChain)

    return (
        <div className="p-6 max-w-4xl mx-auto bg-zinc-950 min-h-screen text-white">
            {/* Chain Tabs */}
            <div className="flex gap-2 mb-8 border-b border-zinc-800">
                <button onClick={() => setActiveChain('solana')} className={`px-6 py-3 rounded-t-xl font-semibold ${activeChain === 'solana' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
                    Solana (Devnet)
                </button>
                <button onClick={() => setActiveChain('ethereum')} className={`px-6 py-3 rounded-t-xl font-semibold ${activeChain === 'ethereum' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
                    Ethereum (Sepolia)
                </button>
            </div>

            <button
                onClick={addNewWallet}
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 py-4 rounded-2xl text-lg font-semibold flex items-center justify-center gap-3"
            >
                {loading ? 'Generating...' : `+ Add ${activeChain === 'solana' ? 'Solana' : 'Ethereum'} Wallet (${selectedWalletIndex})`}
            </button>

            <div className="mt-10 grid gap-6">
                {filteredWallets.map(wallet => (
                    <div key={wallet.id} className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 hover:border-violet-500 transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className={`px-3 py-1 text-xs rounded-full ${wallet.chain === 'solana' ? 'bg-violet-500' : 'bg-blue-500'}`}>
                                    {wallet.chain.toUpperCase()}
                                </span>
                                <p className="text-sm text-zinc-400 mt-3">Wallet {wallets.filter(w => w.chain === wallet.chain).indexOf(wallet)}</p>
                            </div>
                            <button onClick={() => fetchBalance(wallet)} className="text-zinc-400 hover:text-white">
                                <RefreshCw size={18} />
                            </button>
                        </div>

                        <div className="mt-4 font-mono text-lg break-all">{wallet.publicKey}</div>
                        {wallet.balance && <p className="text-emerald-400 mt-2 text-xl font-semibold">{wallet.balance}</p>}

                        {/* Private Key */}
                        <div className="mt-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-zinc-400">Private Key</span>
                                <button onClick={() => togglePrivateKey(wallet.id)} className="flex items-center gap-1 text-xs">
                                    {wallet.showPrivateKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                    {wallet.showPrivateKey ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            <div className="bg-black p-4 rounded-2xl font-mono text-sm break-all">
                                {wallet.showPrivateKey ? wallet.privateKey : '•'.repeat(64)}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => copyToClipboard(wallet.publicKey)} className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-2xl">
                                <Copy size={18} /> Copy Address
                            </button>
                            <button onClick={() => setSelectedWallet(wallet)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 py-3 rounded-2xl flex items-center justify-center gap-2">
                                <Send size={18} /> Send {activeChain === 'solana' ? 'SOL' : 'ETH'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Send Modal (simple inline for brevity - you can turn into proper modal) */}
            {selectedWallet && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-zinc-900 p-8 rounded-3xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-6">Send {selectedWallet.chain === 'solana' ? 'SOL' : 'ETH'}</h2>

                        <input
                            placeholder="Recipient address"
                            value={sendForm.to}
                            onChange={e => setSendForm({ ...sendForm, to: e.target.value })}
                            className="w-full bg-zinc-800 p-4 rounded-2xl mb-4 font-mono"
                        />
                        <input
                            placeholder="Amount"
                            type="number"
                            value={sendForm.amount}
                            onChange={e => setSendForm({ ...sendForm, amount: e.target.value })}
                            className="w-full bg-zinc-800 p-4 rounded-2xl mb-6"
                        />

                        <div className="flex gap-4">
                            <button onClick={() => setSelectedWallet(null)} className="flex-1 py-4 border border-zinc-700 rounded-2xl">Cancel</button>
                            <button onClick={sendTransection} disabled={loading} className="flex-1 bg-emerald-600 py-4 rounded-2xl font-semibold">
                                {loading ? 'Sending...' : 'Confirm Transaction'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

