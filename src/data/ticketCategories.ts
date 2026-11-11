import { TicketCategory, StaffMember } from '../types';

export const INITIAL_TICKET_CATEGORIES: TicketCategory[] = [
  {
    id: 'general',
    name: 'General',
    description: 'General enquiries, site assistance and general questions',
    color: '#38bdf8',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'payment',
    name: 'Payment',
    description: 'Payment confirmations, PIX, card transactions and billing queries',
    color: '#34d399',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Installation assistance, cleaner troubleshooting, crashes or configuration errors',
    color: '#a78bfa',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'account',
    name: 'Account',
    description: 'Account access, credentials and password recovery',
    color: '#fbbf24',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'purchase_issues',
    name: 'Purchase Issues',
    description: 'Order discrepancies, wrong plan or slot activation',
    color: '#60a5fa',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'staff-owner-principal',
    name: 'jogadorprincipal3 (Owner)',
    email: 'jogadorprincipal3@gmail.com',
    role: 'admin',
    permissions: {
      canReply: true,
      canChangeStatus: true,
      canAssignTickets: true,
      canManageInternalNotes: true,
      canManageCategories: true
    },
    active: true,
    assignedTicketsCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'staff-owner-otavio',
    name: 'otaviocarlosm75 (Owner)',
    email: 'otaviocarlosm75@gmail.com',
    role: 'admin',
    permissions: {
      canReply: true,
      canChangeStatus: true,
      canAssignTickets: true,
      canManageInternalNotes: true,
      canManageCategories: true
    },
    active: true,
    assignedTicketsCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

/**
 * Generate unique protocol in the exact requested format: TICKET-000001
 */
export function generateTicketProtocol(existingTicketsCount: number): string {
  // Use sequential number based on count + random offset to guarantee uniqueness
  const num = (existingTicketsCount + 1);
  return `TICKET-${String(num).padStart(6, '0')}`;
}
