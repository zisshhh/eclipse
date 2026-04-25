import { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { MultiChainWallet } from './Wallet';
import * as bip39 from "bip39";
import { Toaster } from './components/ui/sonner';
import { Footer } from './components/Footer';

function App() {
  const [seedPhrase, setSeedPhrase] = useState("");

  useEffect(() => {
    setSeedPhrase(bip39.generateMnemonic());
  }, []);

  return (
    <div className="flex min-h-screen flex-col mx-8">
      <Navbar />
      <MultiChainWallet mnemonic={seedPhrase} />
      <Toaster />
      <Footer />
    </div>
  );
}

export default App;