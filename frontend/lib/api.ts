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

export async function getTransactions(): Promise<Transaction[]> {
  try {
    const response = await fetch(`${API_URL}/api/transactions`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.transactions || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
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
