import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { MultiChainWallet } from './Wallet';
import * as bip39 from "bip39";
import { Toaster } from './components/ui/sonner';

function App() {
  const[seedPhrase, setSeedPhrase] = useState("");

  const generateSeedPhrase = () => {
    const mnemonic = bip39.generateMnemonic(); 
    setSeedPhrase(mnemonic)
  }

  return ( <>
    <Navbar />
    <MultiChainWallet mnemonic={seedPhrase} />
    <Toaster />
    </>
  )
}

export default App;