import {
  isConnected as freighterIsConnected,
  requestAccess as freighterRequestAccess,
  getAddress as freighterGetAddress,
  getNetworkDetails as freighterGetNetworkDetails,
  signTransaction as freighterSignTransaction,
} from '@stellar/freighter-api';

export interface WalletState {
  address: string | null;
  network: string;
  isConnected: boolean;
  isFreighterAvailable: boolean;
  isSimulated: boolean;
  balance: string;
}

const DEMO_ACCOUNTS = {
  alice: {
    address: 'GAAYOCHAINP1ALICE777777777777777777777777777777777777AYO1',
    balance: '500.00',
  },
  bob: {
    address: 'GAAYOCHAINP2BOB88888888888888888888888888888888888888AYO2',
    balance: '500.00',
  },
};

export class WalletService {
  private state: WalletState = {
    address: null,
    network: 'TESTNET',
    isConnected: false,
    isFreighterAvailable: false,
    isSimulated: false,
    balance: '0.00',
  };

  private listeners: Array<(state: WalletState) => void> = [];

  constructor() {
    this.checkFreighterAvailability();
  }

  public subscribe(listener: (state: WalletState) => void): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.state));
  }

  public async checkFreighterAvailability(): Promise<boolean> {
    try {
      const res = await freighterIsConnected();
      const available = !!res && !res.error;
      this.state.isFreighterAvailable = available;
      this.notify();
      return available;
    } catch {
      this.state.isFreighterAvailable = false;
      this.notify();
      return false;
    }
  }

  public async connectFreighter(): Promise<boolean> {
    try {
      const accessObj = await freighterRequestAccess();
      if (accessObj && accessObj.error) {
        throw new Error(accessObj.error);
      }

      const addrObj = await freighterGetAddress();
      if (addrObj && addrObj.address) {
        let net = 'TESTNET';
        try {
          const netObj = await freighterGetNetworkDetails();
          if (netObj && netObj.network) {
            net = netObj.network;
          }
        } catch {
          // ignore
        }

        this.state = {
          address: addrObj.address,
          network: net,
          isConnected: true,
          isFreighterAvailable: true,
          isSimulated: false,
          balance: '125.50',
        };
        this.notify();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Freighter connection failed, falling back to simulator:', err);
      return false;
    }
  }

  /**
   * Connect in Simulated Mode (Testnet Sandbox)
   */
  public connectSimulated(account: 'alice' | 'bob' = 'alice') {
    const acc = DEMO_ACCOUNTS[account];
    this.state = {
      address: acc.address,
      network: 'TESTNET (SANDBOX)',
      isConnected: true,
      isFreighterAvailable: this.state.isFreighterAvailable,
      isSimulated: true,
      balance: acc.balance,
    };
    this.notify();
  }

  public disconnect() {
    this.state = {
      address: null,
      network: 'TESTNET',
      isConnected: false,
      isFreighterAvailable: this.state.isFreighterAvailable,
      isSimulated: false,
      balance: '0.00',
    };
    this.notify();
  }

  public async signTransaction(xdr: string, networkPassphrase?: string): Promise<string> {
    if (this.state.isSimulated) {
      // In simulated mode, return simulated signed XDR
      return xdr;
    }
    const res = await freighterSignTransaction(xdr, { networkPassphrase });
    if (res.error) {
      throw new Error(res.error);
    }
    return res.signedTxXdr;
  }

  public getState(): WalletState {
    return { ...this.state };
  }
}

export const wallet = new WalletService();
