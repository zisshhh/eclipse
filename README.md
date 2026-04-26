# Eclipse Wallet
A modern crypto wallet supporting Solana + Ethereum with real time balance tracking and transaction capabilities.

## Features
- **Multi-Chain Support** - Solana + Ethereum wallet in one wallet.
- **Generate/Import Wallet** - Create a new wallet or import existing one using recovery phrase.
- **Real-time Balance Fetching** — Instantly shows your token and balances.
- **Send Asset** — Easy asset transfers with address validation.

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Solana**: `@solana/web3.js`, `@solana/wallet-adapter`
- **Ethereum**: `ethers.js` / `viem`
- **Styling**: Tailwind CSS

## Get Started

### 1. Clone the Repository

```bash
git clone https://github.com/zisshhh/eclipse.git
cd eclipse
```

### 2. Install Dependencies

```bash
# Install pnpm if you haven't
npm install -g pnpm

# Install all Dependencies
pnpm install
```

### 3. Setup Environment Variables

Create a `.env` file by copying this:

```bash
cp .env.example .env
```

Now open the `.env` file and add your RPC URLs:

```bash
SOL_RPC_URL=https://api.devnet.solana.com
ETH_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

### 4. Run the Project

```bash
pnpm run dev
```

## How it Works

1. **Generating a Wallet:**

   * Generates a new mnemonic phrase and derives the corresponding seed.
   * Uses the seed to generate private and public keys for Solana and Ethereum.
   * Displays the generated keys and mnemonic phrase.

2. **Importing a Wallet:**

   * Allows you to enter a recovery phrase (mnemonic) to restore your existing wallet.
   * Derives private and public keys from the imported recovery phrase.

3. **Visibility Toggle:**

   * Private keys and recovery phrases can be toggled between visible and censored (shown as asterisks) for better security.

4. **Clipboard Copy:**

   * Provides one-click functionality to copy private keys, public keys, and the recovery phrase to the clipboard.

5. **Balance Fetching:**

   * Fetches real-time native balances for SOL and ETH.

6. **Sending Assets:**

   * Creates, signs, and broadcasts transactions securely in the browser without exposing private keys.
