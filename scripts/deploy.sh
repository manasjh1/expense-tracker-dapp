#!/bin/bash

echo "🚀 Expense Tracker dApp Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Aptos CLI is installed
if ! command -v aptos &> /dev/null; then
    echo -e "${RED}❌ Aptos CLI is not installed. Please install it first.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Pre-deployment checklist:${NC}"
echo "1. Aptos CLI installed ✓"
echo "2. Wallet configured"
echo "3. Testnet tokens available"
echo ""

# Get account address
echo -e "${YELLOW}🔍 Getting account information...${NC}"
ACCOUNT_ADDRESS=$(aptos account list --query balance --profile default 2>/dev/null | grep -o '0x[a-fA-F0-9]\{64\}' | head -1)

if [ -z "$ACCOUNT_ADDRESS" ]; then
    echo -e "${RED}❌ No account found. Please run 'aptos init --network testnet' first.${NC}"
    exit 1
fi

echo -e "${BLUE}📍 Account Address: ${ACCOUNT_ADDRESS}${NC}"

# Check balance
echo -e "${YELLOW}💰 Checking account balance...${NC}"
aptos account list --query balance --profile default

# Navigate to contract directory
cd "$(dirname "$0")/../contract" || exit 1

# Compile the Move contract
echo -e "${YELLOW}🔨 Compiling Move contract...${NC}"
aptos move compile --named-addresses expense_tracker=${ACCOUNT_ADDRESS}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contract compiled successfully!${NC}"
else
    echo -e "${RED}❌ Contract compilation failed!${NC}"
    exit 1
fi

# Publish the contract
echo -e "${YELLOW}📤 Publishing contract to Aptos testnet...${NC}"
aptos move publish --named-addresses expense_tracker=${ACCOUNT_ADDRESS} --profile default

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contract published successfully!${NC}"
    echo -e "${GREEN}🎉 Contract Address: ${ACCOUNT_ADDRESS}${NC}"
    echo -e "${GREEN}🏆 Ready for hackathon submission! 🏆${NC}"
else
    echo -e "${RED}❌ Contract publication failed!${NC}"
    exit 1
fi