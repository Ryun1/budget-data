const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Stats response from /api/stats
export interface Stats {
  tom_transactions: number;
  total_balance: string;
  total_balance_lovelace: number;
  treasury_addresses: number;
  latest_block: number | null;
}

// Balance response from /api/balance
export interface Balance {
  balance: string;
  lovelace: number;
}

// Transaction from /api/transactions (TOM metadata)
export interface Transaction {
  tx_hash: string;
  slot: number | null;
  block_number: number | null;
  block_time: number | null;
  action_type: string | null;
  metadata: any;
}

// UTXO from /api/utxos
export interface Utxo {
  tx_hash: string;
  output_index: number;
  owner_addr: string | null;
  lovelace_amount: number | null;
  slot: number | null;
  block_number: number | null;
}

// Treasury address from /api/vendor-contracts
export interface TreasuryAddress {
  address: string;
  stake_credential: string | null;
  balance_lovelace: number;
  utxo_count: number;
  latest_slot: number | null;
}

// Fund flow from /api/fund-flows
export interface FundFlow {
  tx_hash: string;
  slot: number | null;
  block_number: number | null;
  block_time: number | null;
  action_type: string | null;
  destination: string | null;
  metadata: any;
}

export async function getStats(): Promise<Stats | null> {
  try {
    const response = await fetch(`${API_URL}/api/stats`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}

export async function getBalance(): Promise<Balance | null> {
  try {
    const response = await fetch(`${API_URL}/api/balance`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching balance:', error);
    return null;
  }
}

export async function getTransactions(params?: {
  page?: number;
  limit?: number;
  action_type?: string;
}): Promise<Transaction[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.action_type) queryParams.append('action_type', params.action_type);

    const queryString = queryParams.toString();
    const url = `${API_URL}/api/transactions${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

export async function getTransaction(hash: string): Promise<Transaction | null> {
  try {
    const response = await fetch(`${API_URL}/api/transactions/${hash}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
}

export async function getUtxos(): Promise<Utxo[]> {
  try {
    const response = await fetch(`${API_URL}/api/utxos`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching UTXOs:', error);
    return [];
  }
}

export async function getTreasuryAddresses(): Promise<TreasuryAddress[]> {
  try {
    const response = await fetch(`${API_URL}/api/vendor-contracts`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching treasury addresses:', error);
    return [];
  }
}

export async function getFundFlows(): Promise<FundFlow[]> {
  try {
    const response = await fetch(`${API_URL}/api/fund-flows`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching fund flows:', error);
    return [];
  }
}

export async function getFundTransactions(params?: { page?: number; limit?: number }): Promise<Transaction[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = `${API_URL}/api/fund${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching fund transactions:', error);
    return [];
  }
}

export async function getDisburseTransactions(params?: { page?: number; limit?: number }): Promise<Transaction[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = `${API_URL}/api/disburse${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching disburse transactions:', error);
    return [];
  }
}

export async function getWithdrawTransactions(params?: { page?: number; limit?: number }): Promise<Transaction[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = `${API_URL}/api/withdraw${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching withdraw transactions:', error);
    return [];
  }
}

// Helper to format ADA amounts
export function formatAda(lovelace: number): string {
  return (lovelace / 1_000_000).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
}

// Helper to format timestamps
export function formatTime(unixTime: number | null): string {
  if (!unixTime) return '-';
  return new Date(unixTime * 1000).toLocaleString();
}

// Helper to truncate hashes
export function truncateHash(hash: string, chars: number = 8): string {
  if (hash.length <= chars * 2) return hash;
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}
