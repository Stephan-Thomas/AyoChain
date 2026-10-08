#!/usr/bin/env bash
set -euo pipefail

# AyoChain Stellar Testnet Deployment Script
echo "=============================================="
echo "       AyoChain Testnet Deployment Pipeline    "
echo "=============================================="

NETWORK="testnet"
RPC_URL="https://soroban-testnet.stellar.org"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
IDENTITY="${STELLAR_IDENTITY:-default}"

echo "[1/4] Verifying Stellar CLI installation..."
if ! command -v stellar &> /dev/null; then
    echo "Error: stellar CLI is not installed. Install with: cargo install --locked stellar-cli"
    exit 1
fi

echo "[2/4] Building smart contracts..."
cargo build --target wasm32-unknown-unknown --release -p match_contract -p rankings_contract

MATCH_WASM="target/wasm32-unknown-unknown/release/match_contract.wasm"
RANKINGS_WASM="target/wasm32-unknown-unknown/release/rankings_contract.wasm"

echo "[3/4] Deploying contracts to Stellar ${NETWORK}..."
echo "Deploying Match Contract..."
MATCH_CONTRACT_ID=$(stellar contract deploy \
    --wasm "${MATCH_WASM}" \
    --source "${IDENTITY}" \
    --network "${NETWORK}")
echo "Match Contract ID: ${MATCH_CONTRACT_ID}"

echo "Deploying Rankings Contract..."
RANKINGS_CONTRACT_ID=$(stellar contract deploy \
    --wasm "${RANKINGS_WASM}" \
    --source "${IDENTITY}" \
    --network "${NETWORK}")
echo "Rankings Contract ID: ${RANKINGS_CONTRACT_ID}"

echo "[4/4] Initializing contracts and wiring authorizations..."
ADMIN_ADDR=$(stellar keys address "${IDENTITY}")

echo "Initializing Rankings Contract..."
stellar contract invoke \
    --id "${RANKINGS_CONTRACT_ID}" \
    --source "${IDENTITY}" \
    --network "${NETWORK}" \
    -- initialize \
    --admin "${ADMIN_ADDR}"

echo "Wiring Match Contract into Rankings Contract..."
stellar contract invoke \
    --id "${RANKINGS_CONTRACT_ID}" \
    --source "${IDENTITY}" \
    --network "${NETWORK}" \
    -- set_match_contract \
    --match_contract "${MATCH_CONTRACT_ID}"

# Output frontend environment configuration
ENV_FILE="frontend/.env"
echo "Writing contract addresses to ${ENV_FILE}..."
cat <<EOF > "${ENV_FILE}"
VITE_SOROBAN_NETWORK=TESTNET
VITE_SOROBAN_RPC_URL=${RPC_URL}
VITE_NETWORK_PASSPHRASE="${NETWORK_PASSPHRASE}"
VITE_MATCH_CONTRACT_ID=${MATCH_CONTRACT_ID}
VITE_RANKINGS_CONTRACT_ID=${RANKINGS_CONTRACT_ID}
EOF

echo "=============================================="
echo "Deployment successful!"
echo "Match Contract:    ${MATCH_CONTRACT_ID}"
echo "Rankings Contract: ${RANKINGS_CONTRACT_ID}"
echo "Config written to: ${ENV_FILE}"
echo "=============================================="
