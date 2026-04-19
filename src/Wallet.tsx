import { useEffect, useState } from "react"
import type { Wallet } from "./types/wallet"
import { generateMnemonic, mnemonicToSeed } from "bip39";
import { derivePath } from "ed25519-hd-key"
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { ethers } from "ethers";
import { easeInOut, motion } from "framer-motion"
import { ChevronDown } from "lucide-react";
import { Button } from "./components/ui/button";
import { toast } from "sonner";
import { Input } from "./components/ui/input";

const SOL_RPC_URL = import.meta.env.VITE_SOL_RPC_URL;
const ETH_RPC_URL = import.meta.env.VITE_ETH_RPC_URL;

export const MultiChainWallet = ({ mnemonic }: { mnemonic: string }) => {
    const [wallets, setWallets] = useState<Wallet[]>([])
    const [selectedWalletIndex, setSelectedWalletIndex] = useState(0);
    const [activeChain, setActiveChain] = useState<'solana' | 'ethereum' | ''>('');
    const [loading, setLoading] = useState(false);
    const [sendForms, setSendForms] = useState<Record<string, { to: string; amount: string }>>({});
    const [mnemonicInput, setMnemonicInput] = useState<string>("");
    const [showMnemonicCard, setShowMnemonicCard] = useState(true);

    useEffect(() => {
        const savedWallet = localStorage.getItem('multiChainWallets');
        if (savedWallet) {
            const parsed = JSON.parse(savedWallet);
            setWallets(parsed);
        }
    }, [])

    useEffect(() => {
        localStorage.setItem('multiChainWallets', JSON.stringify(wallets))
    }, [wallets])

    const addNewWallet = async () => {
        if (!activeChain) {
            toast.error("Please select a blockchain first.");
            return;
        }

        setLoading(true);
        try {
            let mnemonicSource = mnemonicInput.trim() || mnemonic.trim();
            if (!mnemonicSource) {
                mnemonicSource = generateMnemonic();
                setMnemonicInput(mnemonicSource);
                toast.info("Generated a new mnemonic phrase.");
            }

            let newWallet: Wallet;
            if (activeChain === "solana") {
                const seed = await mnemonicToSeed(mnemonicSource);
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
                const path = `m/44'/60'/${selectedWalletIndex}'/0/0`;
                const ethWallet = ethers.HDNodeWallet.fromPhrase(mnemonicSource, undefined, path);
                newWallet = {
                    id: Date.now().toString(),
                    chain: "ethereum",
                    accountIndex: selectedWalletIndex,
                    publicKey: ethWallet.address,
                    privateKey: ethWallet.privateKey,
                    showPrivateKey: false
                };
            }

            setWallets(prev => [...prev, newWallet]);
            setSelectedWalletIndex(prev => prev + 1);
            toast.success("Wallet created successfully.");

        } catch (e) {
            console.log(e);
            toast.error("Failed to generate wallet.");
        } finally {
            setLoading(false);
        }
    };

    const togglePrivateKey = (walletId: string) => {
        setWallets((prevWallets) =>
            prevWallets.map((wallet) =>
                wallet.id === walletId
                    ? { ...wallet, showPrivateKey: !wallet.showPrivateKey }
                    : wallet
            )
        );
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard.");
        } catch {
            toast.error("Failed to copy.");
        }
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
                const provider = new ethers.JsonRpcProvider(ETH_RPC_URL);
                const balance = await provider.getBalance(wallet.publicKey);
                const ethBalance = ethers.formatEther(balance);
                setWallets(prev => prev.map(w =>
                    w.id === wallet.id ? { ...w, balance: `${Number(ethBalance).toFixed(4)} ETH` } : w
                ));
            }
        } catch (e) {
            console.log(e);
            toast.error("Failed to fetch balance.");
        }
    }

    const updateSendForm = (walletId: string, field: "to" | "amount", value: string) => {
        setSendForms((prev) => ({
            ...prev,
            [walletId]: {
                to: field === "to" ? value : (prev[walletId]?.to ?? ""),
                amount: field === "amount" ? value : (prev[walletId]?.amount ?? ""),
            },
        }));
    };

    const sendTransection = async (wallet: Wallet) => {
        const form = sendForms[wallet.id] ?? { to: "", amount: "" };
        if (!form.to || !form.amount) {
            toast.error("Please provide receiver address and amount.");
            return;
        }

        setLoading(true);

        try {
            if (wallet.chain === "solana") {
                const connection = new Connection(SOL_RPC_URL);

                const fromKeypair = Keypair.fromSecretKey(
                    Uint8Array.from(Buffer.from(wallet.privateKey, 'hex'))
                )

                const transection = new Transaction().add(
                    SystemProgram.transfer({
                        fromPubkey: fromKeypair.publicKey,
                        toPubkey: new PublicKey(form.to),
                        lamports: parseFloat(form.amount) * LAMPORTS_PER_SOL
                    })
                );

                const signature = await connection.sendTransaction(transection, [fromKeypair]);
                await connection.confirmTransaction(signature, 'confirmed');
                toast.success(`Transaction successful: ${signature.slice(0, 8)}...`);
            } else {
                const provider = new ethers.JsonRpcProvider(ETH_RPC_URL);
                const signer = new ethers.Wallet(wallet.privateKey, provider);
                const tx = await signer.sendTransaction({
                    to: form.to,
                    value: ethers.parseEther(form.amount),
                });
                await tx.wait();
                toast.success(`Transaction successful: ${tx.hash.slice(0, 8)}...`);
            }

            fetchBalance(wallet);
            setSendForms((prev) => ({
                ...prev,
                [wallet.id]: { to: "", amount: "" },
            }));
        } catch (e) {
            console.log(e);
            toast.error("Transaction failed.");
        } finally {
            setLoading(false);
        }
    }

    const filteredWallets = activeChain ? wallets.filter((w) => w.chain === activeChain) : [];

    return (
        <div className="flex flex-col gap-4 p-12">
            {activeChain === '' && (
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
                            className="w-32 h-12 cursor-pointer"
                            size={"lg"}
                            onClick={() => {
                                setActiveChain('solana');
                                toast("Wallet selected. Now please generate a wallet.");
                            }}
                        >
                            Solana
                        </Button>
                        <Button
                            className="w-32 h-12 cursor-pointer"
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

            {activeChain !== '' && (
                <>
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.3,
                            ease: "easeInOut",
                        }}
                        className="flex flex-col gap-4 my-12"
                    >
                        <div className="flex flex-col gap-2">
                            <h1 className="tracking-tighter text-4xl md:text-5xl font-black">
                                Secret Recovery Phrase
                            </h1>
                            <p className="text-primary/80 font-semibold text-lg md:text-xl">
                                Enter your mnemonic and create wallets.
                            </p>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4">
                            <Input
                                placeholder="Enter mnemonic phrase"
                                type="password"
                                onChange={(e) => setMnemonicInput(e.target.value)}
                                value={mnemonicInput}
                            />
                            <Button className="cursor-pointer"
                                size={"lg"} disabled={loading} onClick={() => addNewWallet()}>
                                {loading ? "Processing..." : (mnemonicInput ? "Add Wallet" : "Generate Wallet")}
                            </Button>
                            <Button className="cursor-pointer"
                                variant="outline"
                                size="lg"
                                onClick={() => {
                                    setActiveChain('');
                                    setShowMnemonicCard(true);
                                }}
                            >
                                Change Chain
                            </Button>
                        </div>
                    </motion.div>

                    {mnemonicInput.trim() && (
                        <div className="rounded-xl border bg-card text-card-foreground cursor-pointer">
                            <button
                                type="button"
                                className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer"
                                onClick={() => setShowMnemonicCard((prev) => !prev)}
                            >
                                <span className="text-2xl font-bold tracking-tight">Your Secret Phrase</span>
                                <ChevronDown
                                    className={`h-5 w-5 transition-transform ${showMnemonicCard ? "" : "-rotate-90"}`}
                                />
                            </button>

                            {showMnemonicCard && (
                                <div
                                    role="button"
                                    tabIndex={0}
                                    className="px-4 pb-4"
                                    onClick={() => copyToClipboard(mnemonicInput.trim())}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            copyToClipboard(mnemonicInput.trim());
                                        }
                                    }}
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {mnemonicInput.trim().split(/\s+/).map((word, index) => (
                                            <div
                                                key={`${word}-${index}`}
                                                className="rounded-md border bg-background px-3 py-2 text-sm"
                                            >
                                                {word}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-3 text-sm text-primary/70">Click anywhere to copy</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <h2 className="text-2xl font-bold">Your Wallets</h2>
                        {filteredWallets.length === 0 && (
                            <p className="text-primary/70">No wallets yet for this chain.</p>
                        )}
                        {filteredWallets.map((wallet) => (
                            <div
                                key={wallet.id}
                                className="grid grid-cols-1 lg:grid-cols-2 gap-4 rounded-lg border p-4"
                            >
                                <div className="flex flex-col gap-3">
                                    <p className="text-sm text-primary/70">Account #{wallet.accountIndex}</p>
                                    <div className="rounded-md border p-3">
                                        <p className="text-xs text-primary/70">Public Key</p>
                                        <p className="break-all text-sm">{wallet.publicKey}</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-2"
                                            onClick={() => copyToClipboard(wallet.publicKey)}
                                        >
                                            Copy Public Key
                                        </Button>
                                    </div>
                                    <div className="rounded-md border p-3">
                                        <p className="text-xs text-primary/70">Private Key</p>
                                        <p className="break-all text-sm">
                                            {wallet.showPrivateKey ? wallet.privateKey : "................................"}
                                        </p>
                                        <div className="mt-2 flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => togglePrivateKey(wallet.id)}
                                            >
                                                {wallet.showPrivateKey ? "Hide Private Key" : "Show Private Key"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyToClipboard(wallet.privateKey)}
                                            >
                                                Copy Private Key
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => fetchBalance(wallet)}
                                        >
                                            Refresh Balance
                                        </Button>
                                        <p className="text-sm">{wallet.balance ?? "Balance not fetched"}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 rounded-md border p-3">
                                    <h3 className="text-lg font-semibold">Transactions</h3>
                                    <Input
                                        placeholder="Receiver address"
                                        value={sendForms[wallet.id]?.to ?? ""}
                                        onChange={(e) => updateSendForm(wallet.id, "to", e.target.value)}
                                    />
                                    <Input
                                        placeholder={`Amount (${wallet.chain === "solana" ? "SOL" : "ETH"})`}
                                        type="number"
                                        value={sendForms[wallet.id]?.amount ?? ""}
                                        onChange={(e) => updateSendForm(wallet.id, "amount", e.target.value)}
                                    />
                                    <Button
                                        disabled={loading}
                                        onClick={() => sendTransection(wallet)}
                                    >
                                        Send Transaction
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

        </div>
    )
}