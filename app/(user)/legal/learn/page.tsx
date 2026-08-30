'use client';

import LegalLayout from '@/components/user/LegalLayout';

export default function LearnPage() {
  return (
    <LegalLayout title="Learn" lastUpdated="August 2026">
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <p style={{ marginBottom: 16 }}>
          The ONCHYRA Learn section is your comprehensive educational resource for understanding blockchain technology, cryptocurrency, decentralized finance (DeFi), and digital asset security. Whether you are a beginner or an experienced participant, these resources will help you deepen your knowledge and make informed decisions.
        </p>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Blockchain Basics</h3>
        <p style={{ marginBottom: 12 }}>
          Blockchain is a distributed ledger technology that enables secure, transparent, and tamper-proof record-keeping without the need for a central authority. Understanding the fundamentals is essential for anyone participating in the digital asset ecosystem.
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>What is a Blockchain?</strong> A blockchain is a chain of blocks, where each block contains a list of transactions. Each block is linked to the previous block through a cryptographic hash, creating an immutable chain of records.</li>
          <li style={{ marginBottom: 6 }}><strong>Decentralization:</strong> Unlike traditional databases controlled by a single entity, blockchains are distributed across thousands of nodes worldwide. No single party can alter the data without consensus from the network.</li>
          <li style={{ marginBottom: 6 }}><strong>Consensus Mechanisms:</strong> Blockchains use consensus mechanisms like Proof of Work (PoW) or Proof of Stake (PoS) to validate transactions and add new blocks. These mechanisms ensure that all participants agree on the state of the ledger.</li>
          <li style={{ marginBottom: 6 }}><strong>Immutability:</strong> Once a transaction is recorded on the blockchain, it cannot be altered or deleted. This immutability provides a reliable and tamper-proof record of all transactions.</li>
          <li><p><strong>Public vs. Private Blockchains:</strong> Public blockchains (like Bitcoin and Ethereum) are open to anyone, while private blockchains are restricted to authorized participants. ONCHYRA leverages public blockchain networks for transparency and security.</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Cryptocurrency Fundamentals</h3>
        <p style={{ marginBottom: 12 }}>
          Cryptocurrencies are digital or virtual currencies that use cryptography for security and operate on blockchain networks. Key concepts include:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Wallets:</strong> A cryptocurrency wallet is a digital tool that stores your public and private keys, allowing you to send, receive, and manage your digital assets. Wallets can be software-based (mobile, desktop, web) or hardware-based (physical devices).</li>
          <li style={{ marginBottom: 6 }}><strong>Private Keys and Public Keys:</strong> Your private key is a secret code that allows you to authorize transactions. Your public key (derived from your private key) is your wallet address that you share with others to receive funds. Never share your private key with anyone.</li>
          <li style={{ marginBottom: 6 }}><strong>Transactions:</strong> A cryptocurrency transaction is the transfer of digital assets from one wallet to another. Transactions are broadcast to the network, verified by nodes, and permanently recorded on the blockchain.</li>
          <li style={{ marginBottom: 6 }}><strong>Gas Fees:</strong> Most blockchain networks charge transaction fees (gas fees) to compensate validators for processing and securing transactions. Fees vary based on network congestion and transaction complexity.</li>
          <li><p><strong>Stablecoins:</strong> Stablecoins are cryptocurrencies designed to maintain a stable value relative to a reference asset (usually USD). They provide the benefits of digital assets without the price volatility.</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>DeFi Explained</h3>
        <p style={{ marginBottom: 12 }}>
          Decentralized Finance (DeFi) refers to financial services built on blockchain networks that operate without traditional intermediaries like banks or brokerages. DeFi aims to create an open, permissionless, and transparent financial system:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Smart Contracts:</strong> Self-executing contracts with the terms of the agreement directly written into code. Smart contracts automatically enforce and execute the rules of a financial agreement when predefined conditions are met.</li>
          <li style={{ marginBottom: 6 }}><strong>Decentralized Exchanges (DEXs):</strong> Platforms that allow users to trade digital assets directly with each other without a central authority. DEXs use automated market makers (AMMs) or order books to facilitate trades.</li>
          <li style={{ marginBottom: 6 }}><strong>Lending and Borrowing:</strong> DeFi protocols allow users to lend their digital assets to earn interest or borrow assets by providing collateral. Interest rates are determined algorithmically based on supply and demand.</li>
          <li style={{ marginBottom: 6 }}><strong>Yield Farming:</strong> The practice of moving digital assets between different DeFi protocols to maximize returns. Yield farmers earn rewards by providing liquidity to decentralized platforms.</li>
          <li><p><strong>Liquidity Pools:</strong> Pairs of tokens locked in a smart contract that facilitate trading on DEXs. Liquidity providers earn a share of the trading fees generated by the pool.</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Security Best Practices</h3>
        <p style={{ marginBottom: 12 }}>
          Protecting your digital assets requires vigilance and adherence to security best practices. Follow these guidelines to keep your accounts and assets safe:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>Use Strong, Unique Passwords:</strong> Create passwords with at least 12 characters, mixing uppercase, lowercase, numbers, and symbols. Never reuse passwords across different platforms.</li>
          <li style={{ marginBottom: 6 }}><strong>Enable Multi-Factor Authentication (MFA):</strong> Always enable MFA on your accounts. Prefer authenticator apps (Google Authenticator, Authy) over SMS-based verification for better security.</li>
          <li style={{ marginBottom: 6 }}><strong>Beware of Phishing:</strong> Always verify you are on the official ONCHYRA website before entering credentials. Be suspicious of unsolicited emails, messages, or links asking for personal information.</li>
          <li style={{ marginBottom: 6 }}><strong>Secure Your Devices:</strong> Keep your operating system, browser, and antivirus software up to date. Use strong device passwords or biometric locks. Avoid accessing your accounts on public or shared computers.</li>
          <li style={{ marginBottom: 6 }}><strong>Backup Your Keys:</strong> If you hold digital assets in a personal wallet, create secure backups of your private keys and recovery phrases. Store backups in multiple secure locations, such as encrypted USB drives or safety deposit boxes.</li>
          <li><p><strong>Verify Before You Send:</strong> Always double-check wallet addresses before sending transactions. Blockchain transactions are irreversible — sending to the wrong address means permanent loss of funds.</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Glossary of Key Terms</h3>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}><strong>AML (Anti-Money Laundering):</strong> Regulations and procedures designed to prevent the generation of income through illegal activities</li>
          <li style={{ marginBottom: 6 }}><strong>Block Reward:</strong> The reward given to miners or validators for successfully adding a new block to the blockchain</li>
          <li style={{ marginBottom: 6 }}><strong>Cold Storage:</strong> Storing digital assets offline, away from internet-connected devices, for enhanced security</li>
          <li style={{ marginBottom: 6 }}><strong>DeFi (Decentralized Finance):</strong> Financial services built on blockchain networks that operate without traditional intermediaries</li>
          <li style={{ marginBottom: 6 }}><strong>Gas:</strong> The unit used to measure the computational effort required to execute operations on the Ethereum network</li>
          <li style={{ marginBottom: 6 }}><strong>Hash Rate:</strong> The speed at which a computer can complete cryptographic calculations in a blockchain network</li>
          <li style={{ marginBottom: 6 }}><strong>HODL:</strong> A cryptocurrency investment strategy of holding assets long-term regardless of price fluctuations</li>
          <li style={{ marginBottom: 6 }}><strong>Hot Wallet:</strong> A digital wallet connected to the internet, used for frequent transactions but with higher security risks</li>
          <li style={{ marginBottom: 6 }}><strong>Liquidity:</strong> The ease with which an asset can be converted into cash or another asset without significantly affecting its price</li>
          <li style={{ marginBottom: 6 }}><strong>Market Capitalization:</strong> The total value of a cryptocurrency, calculated by multiplying the current price by the total supply</li>
          <li style={{ marginBottom: 6 }}><strong>Node:</strong> A computer that participates in a blockchain network by maintaining a copy of the ledger and validating transactions</li>
          <li style={{ marginBottom: 6 }}><strong>Proof of Stake (PoS):</strong> A consensus mechanism where validators are chosen based on the amount of cryptocurrency they hold and are willing to &quot;stake&quot;</li>
          <li style={{ marginBottom: 6 }}><strong>Proof of Work (PoW):</strong> A consensus mechanism where miners compete to solve complex mathematical puzzles to validate transactions</li>
          <li style={{ marginBottom: 6 }}><strong>Smart Contract:</strong> Self-executing code stored on a blockchain that automatically enforces and executes the terms of an agreement</li>
          <li><p><strong>Tokenomics:</strong> The economic model and design principles governing a cryptocurrency token, including supply, distribution, and utility</p></li>
        </ul>

        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 10, marginTop: 20 }}>Further Reading</h3>
        <p style={{ marginBottom: 12 }}>
          For those interested in diving deeper into these topics, we recommend exploring:
        </p>
        <ul style={{ marginBottom: 16, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Bitcoin Whitepaper by Satoshi Nakamoto — the foundational document of cryptocurrency</li>
          <li style={{ marginBottom: 6 }}>Ethereum Whitepaper by Vitalik Buterin — introducing smart contracts and decentralized applications</li>
          <li style={{ marginBottom: 6 }}>The Infinite Machine by Camila Russo — the story of Ethereum&apos;s creation</li>
          <li style={{ marginBottom: 6 }}>Mastering Bitcoin by Andreas Antonopoulos — a comprehensive technical guide</li>
          <li><p>DeFi and the Future of Finance by Campbell Harvey — an academic perspective on decentralized finance</p></li>
        </ul>
      </div>
    </LegalLayout>
  );
}
