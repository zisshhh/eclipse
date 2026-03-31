import { Keypair } from '@solana/web3.js';
import { mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { useState } from "react";

interface MnemonicProps {
  mnemonic: string;
}

export const SolanaWallet = ({ mnemonic }: MnemonicProps) => {
  const [currentWalletIndex, setCurrentWalletIndex] = useState(0);
  const [publicKeys, setPublicKeys] = useState<string[]>([]);   

  const addWallet = async () => {
    try {
      const seed = mnemonicToSeedSync(mnemonic);                    
      const path = `m/44'/501'/${currentWalletIndex}'/0'`;         
      const { key } = derivePath(path, seed.toString('hex'));      

      const keyPair = Keypair.fromSeed(key);                      

      setPublicKeys(prev => [...prev, keyPair.publicKey.toBase58()]);
      setCurrentWalletIndex(prev => prev + 1);
    } catch (error) {
      console.error("Failed to generate wallet:", error);
      alert("Error generating wallet - check console");
    }
  };

  return (
    <div>
      <button onClick={addWallet}>
        Add Solana Wallet ({currentWalletIndex})
      </button>

      <div style={{ marginTop: '20px' }}>
        {publicKeys.map((pk, index) => (
          <div key={index} style={{ wordBreak: 'break-all', margin: '8px 0' }}>
            Wallet {index}: <strong>{pk}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};