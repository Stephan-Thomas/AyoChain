# AyoChain Stellar Testnet PowerShell Deployment Script
param (
    [string]$Identity = "default",
    [string]$Network = "testnet"
)

$ErrorActionPreference = "Stop"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "       AyoChain Testnet Deployment Pipeline    " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

$RpcUrl = "https://soroban-testnet.stellar.org"
$NetworkPassphrase = "Test SDF Network ; September 2015"

Write-Host "[1/4] Verifying Stellar CLI installation..." -ForegroundColor Yellow
if (-not (Get-Command stellar -ErrorAction SilentlyContinue)) {
    Write-Error "stellar CLI is not installed. Install with: cargo install --locked stellar-cli"
    exit 1
}

Write-Host "[2/4] Building smart contracts..." -ForegroundColor Yellow
cargo build --target wasm32-unknown-unknown --release -p match_contract -p rankings_contract

$MatchWasm = "target/wasm32-unknown-unknown/release/match_contract.wasm"
$RankingsWasm = "target/wasm32-unknown-unknown/release/rankings_contract.wasm"

Write-Host "[3/4] Deploying contracts to Stellar $Network..." -ForegroundColor Yellow
Write-Host "Deploying Match Contract..." -ForegroundColor Gray
$MatchContractId = (stellar contract deploy --wasm $MatchWasm --source $Identity --network $Network).Trim()
Write-Host "Match Contract ID: $MatchContractId" -ForegroundColor Green

Write-Host "Deploying Rankings Contract..." -ForegroundColor Gray
$RankingsContractId = (stellar contract deploy --wasm $RankingsWasm --source $Identity --network $Network).Trim()
Write-Host "Rankings Contract ID: $RankingsContractId" -ForegroundColor Green

Write-Host "[4/4] Initializing contracts and wiring authorizations..." -ForegroundColor Yellow
$AdminAddr = (stellar keys address $Identity).Trim()

Write-Host "Initializing Rankings Contract..." -ForegroundColor Gray
stellar contract invoke `
    --id $RankingsContractId `
    --source $Identity `
    --network $Network `
    -- initialize `
    --admin $AdminAddr

Write-Host "Wiring Match Contract into Rankings Contract..." -ForegroundColor Gray
stellar contract invoke `
    --id $RankingsContractId `
    --source $Identity `
    --network $Network `
    -- set_match_contract `
    --match_contract $MatchContractId

$EnvFile = "frontend/.env"
Write-Host "Writing configuration to $EnvFile..." -ForegroundColor Yellow
@"
VITE_SOROBAN_NETWORK=TESTNET
VITE_SOROBAN_RPC_URL=$RpcUrl
VITE_NETWORK_PASSPHRASE="$NetworkPassphrase"
VITE_MATCH_CONTRACT_ID=$MatchContractId
VITE_RANKINGS_CONTRACT_ID=$RankingsContractId
"@ | Out-File -FilePath $EnvFile -Encoding utf8

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Deployment successful!" -ForegroundColor Green
Write-Host "Match Contract:    $MatchContractId"
Write-Host "Rankings Contract: $RankingsContractId"
Write-Host "Config written to: $EnvFile"
Write-Host "==============================================" -ForegroundColor Cyan
