import { useEffect, useState } from "react"
import type { Wallet } from "./types/wallet"
import { mnemonicToSeed } from "bip39";
import { derivePath } from "ed25519-hd-key"
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { easeInOut, motion } from "framer-motion"
import { Button } from "./components/ui/button";
import {toast} from "sonner";

const ALCHEMY_RPC_URL = import.meta.env.ALCHEMY_RPC_URL;
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

            if (activeChain === "solana") {
                const seed = await mnemonicToSeed(mnemonic);
                const path = `m/44'/501'/${selectedWalletIndex}'/0'`;

                const derivedSeed = derivePath(path, seed.toString("hex")).key;
                const keypair = Keypair.fromSeed(derivedSeed);

                newWallet = {
                    id: Date.now().toString(),
                    chain: "solana",
                    accountIndex: selectedWalletIndex,
                    publicKey: keypair.publicKey.toBase58(),
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
        if (!selectedWallet || !sendForm.to || !sendForm.amount) return;
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
        <div className="flex flex-col gap-4 p-12">
            {filteredWallets.length === 0 && (
                <motion.div className="flex flex-col gap-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.3,
                        ease: easeInOut
                    }}
                >
                    <div className="flex flex-col gap-2">
                        <h1 className="tracking-tighter text-4xl md:text-5xl font-black">
                            Eclips supports multiple Blockchains
                        </h1>
                        <p className="text-primary/80 font-semibold text-lg md:text-xl">
                            Choose a blockchain to get started.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            className="w-32 h-12"
                            size={"lg"}
                            onClick={() => {
                                setActiveChain('solana');
                                toast("Wallet selected. Now please generate a wallet.");
                            }}
                        >
                            Solana
                        </Button>
                        <Button 
                            className="w-32 h-12"
                            size={"lg"}
                            onClick={() => {
                                setActiveChain('ethereum');
                                toast("Wallet selected. Now please generate a wallet.");
                            }}
                        >
                            Ethereum
                        </Button>
                    </div>
                </motion.div>
            )}
        </div>
    )
}