const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface Treasury {
  instance_id: number;
  script_hash: string;
  payment_address: string;
  stake_address?: string;
  label?: string;
  description?: string;
}

export interface Project {
  project_id: number;
  identifier: string;
  label?: string;
  description?: string;
  vendor_label?: string;
}

export interface Transaction {
  tx_hash: string;
  event_type?: string;
  slot: number;
  block_height?: number;
}

export interface Milestone {
  milestone_id: number;
  project_id: number;
  identifier: string;
  status: string;
  amount_lovelace?: number;
}

export interface VendorContract {
  contract_id: number;
  project_id: number;
  payment_address: string;
  script_hash?: string;
}

export interface Event {
  event_id: number;
  event_type: string;
  tx_id: number;
  project_id?: number;
}

export async function getTreasury(): Promise<Treasury | null> {
  try {
    const response = await fetch(`${API_URL}/api/treasury`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching treasury:', error);
    return null;
  }
}

export async function getProjects(): Promise<Project[]> {
  try {
    const response = await fetch(`${API_URL}/api/projects`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.projects || [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export async function getProject(id: number): Promise<Project | null> {
  try {
    const response = await fetch(`${API_URL}/api/projects/${id}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

export async function getTransactions(params?: { limit?: number; offset?: number; event_type?: string; project_id?: number }): Promise<Transaction[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.event_type) queryParams.append('event_type', params.event_type);
    if (params?.project_id) queryParams.append('project_id', params.project_id.toString());
    
    const queryString = queryParams.toString();
    const url = `${API_URL}/api/transactions${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return data.transactions || [];
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

export async function getMilestones(): Promise<Milestone[]> {
  try {
    const response = await fetch(`${API_URL}/api/milestones`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.milestones || [];
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return [];
  }
}

export async function getVendorContracts(): Promise<VendorContract[]> {
  try {
    const response = await fetch(`${API_URL}/api/vendor-contracts`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.vendor_contracts || [];
  } catch (error) {
    console.error('Error fetching vendor contracts:', error);
    return [];
  }
}

export async function getEvents(params?: { limit?: number; offset?: number; event_type?: string; project_id?: number }): Promise<any[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.event_type) queryParams.append('event_type', params.event_type);
    if (params?.project_id) queryParams.append('project_id', params.project_id.toString());
    
    const queryString = queryParams.toString();
    const url = `${API_URL}/api/events${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}
