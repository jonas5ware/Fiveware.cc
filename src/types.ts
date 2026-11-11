export interface Product {
  id: string;
  title: string;
  subtitle: string;
  category: 'courses' | 'boilerplates' | 'ai' | 'security' | 'infra';
  categoryLabel: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  studentsCount: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  duration: string;
  iconType: 'next' | 'boilerplate' | 'ai' | 'security' | 'infra' | 'motion';
  badge?: string;
  description: string;
  features: string[];
  modules: {
    title: string;
    lessons: string[];
  }[];
  stack: string[];
}

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent' | 'medium' | 'critical' | 'baixa' | 'media' | 'alta' | 'critica';

export type TicketStatus = 
  | 'open' 
  | 'in_progress' 
  | 'waiting_customer' 
  | 'resolved' 
  | 'closed'
  | 'in_review'
  | 'responded'
  | 'aberto'
  | 'em_analise'
  | 'respondido'
  | 'fechado';

export interface TicketCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface TicketAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

export interface TicketReply {
  id: string;
  sender: 'user' | 'admin' | 'staff' | 'system';
  senderName: string;
  senderId?: string;
  message: string;
  timestamp: string;
  attachments?: TicketAttachment[];
}

export interface InternalNote {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'staff' | 'specialist';
  content: string;
  createdAt: string;
}

export interface TicketPurchaseInfo {
  orderNumber?: string;
  productName?: string;
  amount?: number;
  currency?: string;
  purchaseDate?: string;
  status?: 'completed' | 'pending' | 'refunded' | 'cancelled';
  transactionId?: string;
  paymentMethod?: string;
}

export interface TicketTranscript {
  id: string;
  ticketId: string;
  protocol: string;
  name: string;
  email: string;
  subject: string;
  category?: string;
  categoryName?: string;
  priority: TicketPriority;
  description: string;
  assignedStaffName?: string;
  createdAt: string;
  closedAt: string;
  closedReason?: string;
  deletedAt?: string;
  replies: TicketReply[];
  attachments?: TicketAttachment[];
}

export interface Ticket {
  id: string;
  protocol: string; // TICKET-000001 format
  userId?: string;
  user_id?: string;
  name: string;
  email: string;
  subject: string;
  category: string; // e.g. 'purchase_issues', 'payments', etc.
  categoryName?: string;
  priority: TicketPriority;
  description: string;
  status: TicketStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  createdAt: string;
  lastActivityAt?: string;
  closedReason?: string;
  discordTag?: string;
  purchaseInfo?: TicketPurchaseInfo;
  replies: TicketReply[];
  internalNotes?: InternalNote[]; // STRICTLY FOR STAFF / ADMIN
  attachments?: TicketAttachment[];
  unreadByCustomer?: boolean;
  unreadByStaff?: boolean;
}

export interface StaffPermissions {
  canReply: boolean;
  canChangeStatus: boolean;
  canAssignTickets: boolean;
  canManageInternalNotes: boolean;
  canManageCategories?: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'specialist';
  permissions: StaffPermissions;
  active: boolean;
  assignedTicketsCount?: number;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  productId: string;
  productName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod: string;
  createdAt: string;
  completedAt?: string;
}

export type SiteRole = 'owner' | 'admin' | 'customer' | 'member';

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  discordUsername: string;
  role: SiteRole;
  createdAt: string;
  purchasesCount?: number;
  hasActivePlan?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  emailVerified?: boolean;
  isAdminGranted: boolean;
  role?: SiteRole;
  loggedAt: string;
}

