# Expense Tracker dApp

A decentralized expense tracking application built on Aptos blockchain. Users can permanently store their expenses on-chain with categorization and real-time statistics.

## Live Demo

Frontend: https://expense-tracker-dapp-murex.vercel.app
Repository: https://github.com/manasjh1/expense-tracker-dapp

## Features

- Permanent expense storage on Aptos blockchain
- Category-based expense organization (8 categories)
- Real-time spending statistics and breakdowns
- Demo mode for testing without wallet connection
- Petra wallet integration for secure transactions
- Responsive web interface

## Smart Contract Deployment


**Network:** Aptos Testnet
**Contract Address:** 0x412dde714b4208702b754ec0b7b5a247079b1245784cd379dd6752dc2626a577
**Module Name:** expense_tracker

**Deployment Transaction Details:**
- Transaction Hash: 0x0b2598aa2abee4927dfe843bd2ad9b5fe683079308fe818438af153f46d13e1b
- Status: Successfully Executed
- Gas Used: 3,129 units
- Gas Price: 100 Octas per unit
- Block Version: 6,935,403,485
- Timestamp: 2024-10-31 16:41:28 UTC

View on Aptos Explorer: https://explorer.aptoslabs.com/account/0x412dde714b4208702b754ec0b7b5a247079b1245784cd379dd6752dc2626a577?network=testnet

## Technology Stack

**Smart Contract:** Move language on Aptos blockchain
**Frontend:** HTML, CSS, JavaScript with Petra wallet integration
**Deployment:** Vercel for frontend hosting

## Project Structure

```
expense-tracker-dapp/
├── contract/
│   ├── sources/expense_tracker.move
│   └── Move.toml
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── styles.css
└── scripts/deploy.sh
```

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/manasjh1/expense-tracker-dapp.git
```

2. For local development, install Aptos CLI and initialize an account
```bash
aptos init --network testnet
```

3. Fund your account at https://aptos.dev/network/faucet

4. Update the contract address in `frontend/script.js` if deploying your own instance

## Smart Contract Functions

- `initialize_tracker()` - Set up expense tracking for a user
- `add_expense(amount, description, category, date)` - Add new expense
- `delete_expense(expense_id)` - Remove an expense
- `get_expenses(user_address)` - Retrieve all expenses
- `get_total_spent(user_address)` - Get total spending amount
- `get_expense_count(user_address)` - Get number of expenses

## Expense Categories

1. Food & Dining
2. Transportation  
3. Entertainment
4. Bills & Utilities
5. Shopping
6. Healthcare
7. Education
8. Other

## Usage

The application works in two modes:

**With Petra Wallet:** Connect your wallet to store expenses permanently on the blockchain. All transactions require wallet approval and cost a small amount of APT.

**Demo Mode:** Try the application without a wallet connection. Uses local storage to simulate blockchain functionality for testing purposes.

## Deployment Information

This project was built for the Aerotoxs hackathon. The smart contract is deployed on Aptos testnet and the frontend is hosted on Vercel with automatic deployments from the main branch.

For questions or contributions, visit the GitHub repository.
