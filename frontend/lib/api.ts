const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Stats response from /api/stats
export interface Stats {
  tom_transactions: number;
  total_balance: string;
  total_balance_lovelace: number;
  treasury_addresses: number;
  latest_block: number | null;
  project_count: number;
  milestone_count: number;
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

// Treasury address from /api/treasury-contracts
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

// Project (vendor contract) from /api/projects - now uses treasury.v_vendor_contracts_summary
export interface Project {
  id: number;
  project_id: string;
  project_name: string | null;
  description: string | null;
  vendor_name: string | null;
  vendor_address: string | null;
  contract_address: string | null;
  fund_tx_hash: string;
  fund_slot: number | null;
  fund_block_time: number | null;
  initial_amount_lovelace: number | null;
  status: string | null;
  treasury_instance: string | null;
  total_milestones: number | null;
  completed_milestones: number | null;
  disbursed_milestones: number | null;
  current_balance: number | null;
  utxo_count: number | null;
  // Compatibility aliases for old code
  milestone_count?: number;
  contract_instance?: string | null;
  created_slot?: number | null;
  created_time?: number | null;
  created_block?: number | null;
}

// Milestone from /api/projects/:id
export interface Milestone {
  project_id: string;
  milestone_id: string;
  milestone_order: number;
  label: string | null;
  description: string | null;
  acceptance_criteria: string | null;
  amount_lovelace: number | null;
  status: 'pending' | 'completed' | 'disbursed';
  complete_tx_hash: string | null;
  complete_time: number | null;
  complete_description: string | null;
  evidence: any;
  disburse_tx_hash: string | null;
  disburse_time: number | null;
  disburse_amount: number | null;
  // Compatibility alias
  milestone_label?: string | null;
}

// Project event
export interface ProjectEvent {
  tx_hash: string;
  slot: number | null;
  block_time: number | null;
  event_type: string;
  milestone_id: string | null;
  metadata: any;
}

// Project UTXO
export interface ProjectUtxo {
  tx_hash: string;
  output_index: number;
  lovelace_amount: number;
  slot: number;
  block_number: number | null;
}

// Full project detail from /api/projects/:id
export interface ProjectDetail {
  project: Project;
  milestones: Milestone[];
  events: ProjectEvent[];
  utxos: ProjectUtxo[];
  // Compatibility - these now come from project object
  balance_lovelace?: number;
  utxo_count?: number;
}

// TOM Event with context from /api/events
export interface TomEvent {
  id: number;
  tx_hash: string;
  slot: number | null;
  block_number: number | null;
  block_time: number | null;
  event_type: string;
  amount_lovelace: number | null;
  reason: string | null;
  destination: string | null;
  metadata: any;
  treasury_instance: string | null;
  project_id: string | null;
  project_name: string | null;
  milestone_label: string | null;
  milestone_order: number | null;
}

// Treasury contract from /api/treasury
export interface TreasuryContract {
  treasury_id: number;
  contract_instance: string;
  contract_address: string | null;
  name: string | null;
  status: string | null;
  publish_time: number | null;
  initialized_at: number | null;
  vendor_contract_count: number | null;
  active_contracts: number | null;
  treasury_balance: number | null;
  total_events: number | null;
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
    const response = await fetch(`${API_URL}/api/treasury-contracts`);
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

export async function getProjects(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<Project[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = `${API_URL}/api/projects${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const projects = await response.json();
    // Add compatibility fields
    return projects.map((p: Project) => ({
      ...p,
      milestone_count: p.total_milestones || 0,
      contract_instance: p.treasury_instance,
      created_slot: p.fund_slot,
      created_time: p.fund_block_time,
    }));
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export async function getProject(projectId: string): Promise<ProjectDetail | null> {
  try {
    const response = await fetch(`${API_URL}/api/projects/${encodeURIComponent(projectId)}`);
    if (!response.ok) return null;
    const detail = await response.json();
    // Add compatibility fields
    const project = {
      ...detail.project,
      milestone_count: detail.project.total_milestones || 0,
      contract_instance: detail.project.treasury_instance,
      created_slot: detail.project.fund_slot,
      created_time: detail.project.fund_block_time,
    };
    const milestones = detail.milestones.map((m: Milestone) => ({
      ...m,
      milestone_label: m.label,
    }));
    return {
      ...detail,
      project,
      milestones,
      balance_lovelace: detail.project.current_balance || 0,
      utxo_count: detail.project.utxo_count || 0,
    };
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

export async function getProjectMilestones(projectId: string): Promise<Milestone[]> {
  try {
    const response = await fetch(`${API_URL}/api/projects/${encodeURIComponent(projectId)}/milestones`);
    if (!response.ok) return [];
    const milestones = await response.json();
    // Add compatibility field
    return milestones.map((m: Milestone) => ({
      ...m,
      milestone_label: m.label,
    }));
  } catch (error) {
    console.error('Error fetching project milestones:', error);
    return [];
  }
}

export async function getProjectEvents(projectId: string): Promise<ProjectEvent[]> {
  try {
    const response = await fetch(`${API_URL}/api/projects/${encodeURIComponent(projectId)}/events`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching project events:', error);
    return [];
  }
}

// New: Get all TOM events
export async function getEvents(params?: {
  page?: number;
  limit?: number;
  type?: string;
  project_id?: string;
}): Promise<TomEvent[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.project_id) queryParams.append('project_id', params.project_id);

    const queryString = queryParams.toString();
    const url = `${API_URL}/api/events${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

// New: Get treasury contracts
export async function getTreasuryContracts(): Promise<TreasuryContract[]> {
  try {
    const response = await fetch(`${API_URL}/api/treasury`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching treasury contracts:', error);
    return [];
  }
}

// Helper to format ADA amounts
export function formatAda(lovelace: number | null | undefined): string {
  if (lovelace == null) return '0.00';
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
