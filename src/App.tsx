import { useState } from 'react';
import MultiChainWallet from './components/MultiChainWallet';

function App() {
  const [mnemonic, setMnemonic] = useState("test test test test test test test test test test test test"); // Change this

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-900/10 via-transparent to-blue-900/10 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/10 bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-blue-500 rounded-2xl flex items-center justify-center text-xl font-bold">
              K
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Kosh Wallet</h1>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10">
              Testnet Mode
            </div>
            <div className="text-emerald-400 text-xs px-3 py-1.5 bg-emerald-950 border border-emerald-500/30 rounded-full">
              ● Connected to Alchemy
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-zinc-300 to-zinc-400 bg-clip-text text-transparent">
            Multi-Chain HD Wallet
          </h2>
          <p className="text-zinc-400 text-lg max-w-md mx-auto">
            Generate unlimited Solana and Ethereum accounts from one mnemonic • Real transactions on testnet
          </p>
        </div>

        {/* Mnemonic Input */}
        <div className="max-w-3xl mx-auto mb-12">
          <label className="text-zinc-400 text-sm mb-3 block font-medium">YOUR SECRET RECOVERY PHRASE</label>
          <textarea
            value={mnemonic}
            onChange={(e) => setMnemonic(e.target.value)}
            className="w-full bg-zinc-900/70 border border-white/10 rounded-3xl p-6 font-mono text-sm leading-relaxed resize-none h-32 focus:outline-none focus:border-violet-500 transition-colors"
            placeholder="Enter your 12 or 24 word mnemonic phrase..."
          />
          <p className="text-amber-500 text-xs mt-3 flex items-center gap-2">
            ⚠️ Use only testnet mnemonic. Never enter your real wallet seed.
          </p>
        </div>

        {/* Main Wallet Component */}
        <MultiChainWallet mnemonic={mnemonic} />

        {/* Footer Info */}
        <div className="text-center text-zinc-500 text-sm mt-20">
          Built as a Resume Project • Solana + Ethereum • Alchemy RPC • Tailwind CSS
        </div>
      </div>
    </div>
  );
}

export default App;