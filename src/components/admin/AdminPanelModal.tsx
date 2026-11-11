import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  X, 
  MessageSquare, 
  Send, 
  Clock, 
  AlertCircle, 
  Sliders, 
  RefreshCw, 
  Trash2, 
  Megaphone, 
  Lock, 
  User, 
  Mail, 
  Search, 
  FileText, 
  Timer, 
  Zap, 
  RotateCcw, 
  Archive,
  Tag,
  Users,
  CheckCircle2,
  Plus,
  Edit2,
  TrendingUp,
  UserCheck,
  Shield,
  Layers
} from 'lucide-react';
import { Ticket, TicketStatus, TicketCategory, StaffMember, TicketTranscript, RegisteredUser, SiteRole } from '../../types';
import { useToast } from '../common/Toast';
import { TranscriptViewerModal } from './TranscriptViewerModal';
import { sanitizeInput, logSecurityEvent, addTicketReplyInFirestore, updateTicketInFirestore, isOwnerEmail } from '../../lib/firebase';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
  transcripts?: TicketTranscript[];
  categories: TicketCategory[];
  staffMembers: StaffMember[];
  registeredUsers?: RegisteredUser[];
  onUpdateUserRole?: (userId: string, newRole: SiteRole) => void;
  currentUserEmail?: string;
  onUpdateTicket: (updatedTicket: Ticket) => void;
  onDeleteTicket: (ticketId: string) => void;
  onResetTickets: () => void;
  onClearTicketHistory?: (options?: { includeClosedTickets?: boolean }) => void;
  onRestoreTicket?: (transcript: TicketTranscript) => void;
  onResetCooldown?: () => void;
  lastTicketTime?: number | null;
  onUpdateCategories: (categories: TicketCategory[]) => void;
  onUpdateStaffMembers: (staff: StaffMember[]) => void;
  globalBanner: { enabled: boolean; message: string; type: 'info' | 'warning' | 'success' };
  onUpdateGlobalBanner: (banner: { enabled: boolean; message: string; type: 'info' | 'warning' | 'success' }) => void;
  systemStatusText: string;
  onUpdateSystemStatusText: (text: string) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  tickets,
  transcripts = [],
  categories,
  staffMembers,
  registeredUsers = [],
  onUpdateUserRole,
  currentUserEmail,
  onUpdateTicket,
  onDeleteTicket,
  onResetTickets,
  onClearTicketHistory,
  onRestoreTicket,
  onResetCooldown,
  onUpdateCategories,
  onUpdateStaffMembers,
  globalBanner,
  onUpdateGlobalBanner,
  systemStatusText,
  onUpdateSystemStatusText
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'tickets' | 'roles' | 'categories' | 'staff' | 'transcripts' | 'controls'>('tickets');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminReplyText, setAdminReplyText] = useState('');
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | SiteRole>('all');

  // Category creation form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('#38bdf8');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');

  // Staff creation form
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'admin' | 'staff' | 'specialist'>('staff');

  // Transcript Viewer Modal State
  const [activeTranscript, setActiveTranscript] = useState<TicketTranscript | null>(null);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);

  // Clear Ticket History Modal State
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [includeClosedTickets, setIncludeClosedTickets] = useState(true);
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');

  // Site controls form state
  const [bannerEnabled, setBannerEnabled] = useState(globalBanner.enabled);
  const [bannerMessage, setBannerMessage] = useState(globalBanner.message);
  const [bannerType, setBannerType] = useState(globalBanner.type);
  const [statusText, setStatusText] = useState(systemStatusText);

  if (!isOpen) return null;

  // KPIs
  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'aberto').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress' || t.status === 'in_review' || t.status === 'em_analise').length;
  const waitingCustCount = tickets.filter(t => t.status === 'waiting_customer' || t.status === 'responded' || t.status === 'respondido').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
  const closedCount = tickets.filter(t => t.status === 'closed' || t.status === 'fechado').length;
  const totalCount = tickets.length;

  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== 'all') {
      const isMatch = ticket.status === statusFilter || 
        (statusFilter === 'open' && ticket.status === 'aberto') ||
        (statusFilter === 'in_progress' && (ticket.status === 'in_review' || ticket.status === 'em_analise')) ||
        (statusFilter === 'waiting_customer' && (ticket.status === 'responded' || ticket.status === 'respondido')) ||
        (statusFilter === 'closed' && ticket.status === 'fechado');
      if (!isMatch) return false;
    }

    if (staffFilter !== 'all') {
      if (staffFilter === 'unassigned' && ticket.assignedStaffId) return false;
      if (staffFilter !== 'unassigned' && ticket.assignedStaffId !== staffFilter) return false;
    }

    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const match =
        ticket.protocol.toLowerCase().includes(query) ||
        ticket.name.toLowerCase().includes(query) ||
        ticket.email.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query);
      if (!match) return false;
    }

    return true;
  });

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || filteredTickets[0] || null;

  // Handle Category Management (Requirement 5: Criar, editar e remover categorias)
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: TicketCategory = {
      id: `cat-${Date.now()}`,
      name: sanitizeInput(newCatName.trim()),
      description: sanitizeInput(newCatDesc.trim()),
      color: newCatColor,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    onUpdateCategories([...categories, newCat]);
    setNewCatName('');
    setNewCatDesc('');

    toast({
      type: 'success',
      title: 'Category Created',
      description: `Category "${newCat.name}" is now available in the support portal.`
    });
  };

  const handleSaveEditCategory = (catId: string) => {
    if (!editCatName.trim()) return;
    const updated = categories.map((c) => {
      if (c.id === catId) {
        return {
          ...c,
          name: sanitizeInput(editCatName.trim()),
          description: sanitizeInput(editCatDesc.trim())
        };
      }
      return c;
    });
    onUpdateCategories(updated);
    setEditingCategoryId(null);
    toast({ type: 'success', title: 'Category Updated' });
  };

  const handleRemoveCategory = (catId: string) => {
    if (categories.length <= 1) {
      toast({ type: 'error', title: 'Action Denied', description: 'At least one category must remain active.' });
      return;
    }
    const updated = categories.filter((c) => c.id !== catId);
    onUpdateCategories(updated);
    toast({ type: 'info', title: 'Category Removed' });
  };

  // Handle Staff Management (Requirement 5: Gerenciar funcionários e atribuir permissões)
  const handleAddStaffMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;

    const cleanEmail = sanitizeInput(newStaffEmail.trim().toLowerCase());
    const newStaff: StaffMember = {
      id: `staff-${Date.now()}`,
      name: sanitizeInput(newStaffName.trim()),
      email: cleanEmail,
      role: newStaffRole,
      permissions: {
        canReply: true,
        canChangeStatus: true,
        canAssignTickets: true,
        canManageInternalNotes: true,
        canManageCategories: newStaffRole === 'admin'
      },
      active: true,
      assignedTicketsCount: 0,
      createdAt: new Date().toISOString()
    };

    onUpdateStaffMembers([...staffMembers, newStaff]);
    setNewStaffName('');
    setNewStaffEmail('');

    toast({
      type: 'success',
      title: 'Staff Member Added',
      description: `${newStaff.name} has been enrolled with role ${newStaff.role}.`
    });
  };

  const handleToggleStaffActive = (staffId: string) => {
    const updated = staffMembers.map((s) => {
      if (s.id === staffId) {
        return { ...s, active: !s.active };
      }
      return s;
    });
    onUpdateStaffMembers(updated);
    toast({ type: 'info', title: 'Staff Status Toggled' });
  };

  const handleTogglePermission = (staffId: string, permKey: keyof StaffMember['permissions']) => {
    const updated = staffMembers.map((s) => {
      if (s.id === staffId) {
        return {
          ...s,
          permissions: {
            ...s.permissions,
            [permKey]: !s.permissions[permKey]
          }
        };
      }
      return s;
    });
    onUpdateStaffMembers(updated);
    toast({ type: 'success', title: 'Permissions Updated' });
  };

  const handleRemoveStaff = (staffId: string) => {
    if (staffMembers.length <= 1) {
      toast({ type: 'error', title: 'Cannot Delete Lead', description: 'At least one administrator must remain.' });
      return;
    }
    onUpdateStaffMembers(staffMembers.filter(s => s.id !== staffId));
    toast({ type: 'info', title: 'Staff Member Removed' });
  };

  // Confirm Purge
  const handleConfirmClearHistory = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminConfirmPassword.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setConfirmError(data.error || 'Chave de segurança administrativa incorreta.');
        return;
      }
    } catch {
      setConfirmError('Erro ao validar autorização com o servidor.');
      return;
    }

    if (onClearTicketHistory) {
      onClearTicketHistory({ includeClosedTickets });
    }

    setShowClearHistoryModal(false);
    setAdminConfirmPassword('');
    setConfirmError('');
    toast({
      type: 'success',
      title: 'Audit Records Cleared',
      description: 'Historical tickets and transcripts purged by administrator.'
    });
  };

  const handleSendAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !adminReplyText.trim()) return;

    const cleanReply = sanitizeInput(adminReplyText.trim());
    const newReply = {
      id: `r-${Date.now()}`,
      sender: 'admin' as const,
      senderName: 'Master Administrator',
      message: cleanReply,
      timestamp: new Date().toISOString()
    };

    const updated: Ticket = {
      ...selectedTicket,
      status: 'waiting_customer',
      lastActivityAt: new Date().toISOString(),
      replies: [...selectedTicket.replies, newReply],
      unreadByCustomer: true,
      unreadByStaff: false
    };

    onUpdateTicket(updated);
    addTicketReplyInFirestore(selectedTicket.id, newReply).catch(console.error);
    setAdminReplyText('');

    toast({
      type: 'success',
      title: 'Reply Dispatched',
      description: `Staff response registered on enquiry ${selectedTicket.protocol}.`
    });
  };

  const handleStatusChange = (newStatus: TicketStatus) => {
    if (!selectedTicket) return;

    const updated: Ticket = {
      ...selectedTicket,
      status: newStatus,
      lastActivityAt: new Date().toISOString(),
      closedReason: (newStatus === 'closed' || newStatus === 'fechado') ? 'Concluded by Master Administrator' : undefined
    };

    onUpdateTicket(updated);
    updateTicketInFirestore(selectedTicket.id, {
      status: newStatus,
      lastActivityAt: updated.lastActivityAt,
      closedReason: updated.closedReason
    }).catch(console.error);

    toast({
      type: 'info',
      title: 'Status Updated',
      description: `Ticket ${selectedTicket.protocol} marked as "${newStatus}".`
    });
  };

  const handleAssignTicket = (staffId: string) => {
    if (!selectedTicket) return;
    const staff = staffMembers.find(s => s.id === staffId);
    const updated: Ticket = {
      ...selectedTicket,
      assignedStaffId: staff ? staff.id : undefined,
      assignedStaffName: staff ? staff.name : undefined,
      lastActivityAt: new Date().toISOString()
    };
    onUpdateTicket(updated);
    updateTicketInFirestore(selectedTicket.id, {
      assignedStaffId: updated.assignedStaffId,
      assignedStaffName: updated.assignedStaffName,
      lastActivityAt: updated.lastActivityAt
    }).catch(console.error);

    toast({
      type: 'info',
      title: 'Assignee Changed',
      description: staff ? `Assigned to ${staff.name}` : 'Ticket unassigned'
    });
  };

  const handleOpenTicketTranscript = (ticket: Ticket) => {
    const isClosed = ticket.status === 'closed' || ticket.status === 'fechado';
    const transcriptObj: TicketTranscript = {
      id: `tr-${ticket.id}`,
      ticketId: ticket.id,
      protocol: ticket.protocol,
      name: ticket.name,
      email: ticket.email,
      subject: ticket.subject,
      category: ticket.category,
      categoryName: ticket.categoryName,
      priority: ticket.priority,
      description: ticket.description,
      assignedStaffName: ticket.assignedStaffName,
      createdAt: ticket.createdAt,
      closedAt: isClosed ? (ticket.lastActivityAt || new Date().toISOString()) : 'Active (In Progress)',
      closedReason: ticket.closedReason || (isClosed ? 'Concluded' : 'In Progress'),
      replies: ticket.replies,
      attachments: ticket.attachments
    };
    setActiveTranscript(transcriptObj);
    setIsTranscriptModalOpen(true);
  };

  const handleSaveSiteControls = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGlobalBanner({
      enabled: bannerEnabled,
      message: sanitizeInput(bannerMessage.trim()),
      type: bannerType
    });
    onUpdateSystemStatusText(sanitizeInput(statusText.trim()));

    toast({
      type: 'success',
      title: 'Settings Saved',
      description: 'Announcement banner and operational status updated across the site.'
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-6xl h-[92vh] max-h-[870px] bg-[#0c0c0e] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col"
        >
          {/* Header */}
          <div className="px-5 py-3 border-b border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold font-display text-white">
                    Master Administrative Terminal
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/50 font-bold">
                    PAINEL ADMINISTRATIVO
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Full oversight: Categories, Employees, Permissions, Transcripts & Global Settings
                </p>
              </div>
            </div>

            {/* Navigation Tabs & Close */}
            <div className="flex items-center gap-2">
              <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs flex-wrap">
                <button
                  onClick={() => setActiveTab('tickets')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'tickets'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Tickets ({tickets.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('roles')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'roles'
                      ? 'bg-zinc-800 text-amber-300 shadow-sm'
                      : 'text-zinc-400 hover:text-amber-300'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cargos & Permissões</span>
                </button>

                <button
                  onClick={() => setActiveTab('categories')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'categories'
                      ? 'bg-zinc-800 text-sky-300 shadow-sm'
                      : 'text-zinc-400 hover:text-sky-300'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 text-sky-400" />
                  <span>Categories ({categories.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('staff')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'staff'
                      ? 'bg-zinc-800 text-emerald-300 shadow-sm'
                      : 'text-zinc-400 hover:text-emerald-300'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Employees ({staffMembers.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('transcripts')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'transcripts'
                      ? 'bg-zinc-800 text-purple-300 shadow-sm'
                      : 'text-zinc-400 hover:text-purple-300'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5 text-purple-400" />
                  <span>Audits ({transcripts.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('controls')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'controls'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Controls</span>
                </button>
              </div>

              <button
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics & KPI Strip (Requirement 5: Visualizar quantidade de tickets abertos e resolvidos) */}
          <div className="px-5 py-2.5 bg-zinc-950 border-b border-zinc-800/70 grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs font-mono shrink-0">
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Total</span>
                <span className="font-bold text-white text-sm">{totalCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-sky-950/30 border border-sky-800/40">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <div>
                <span className="text-[10px] text-sky-400 uppercase block">Open</span>
                <span className="font-bold text-sky-300 text-sm">{openCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-amber-950/30 border border-amber-800/40">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <div>
                <span className="text-[10px] text-amber-400 uppercase block">In Progress</span>
                <span className="font-bold text-amber-300 text-sm">{inProgressCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-blue-950/30 border border-blue-800/40">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <div>
                <span className="text-[10px] text-blue-400 uppercase block">Waiting Cust.</span>
                <span className="font-bold text-blue-300 text-sm">{waitingCustCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <div>
                <span className="text-[10px] text-emerald-400 uppercase block">Resolved</span>
                <span className="font-bold text-emerald-300 text-sm">{resolvedCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
              <Archive className="w-3.5 h-3.5 text-zinc-400" />
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Closed</span>
                <span className="font-bold text-zinc-400 text-sm">{closedCount}</span>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'tickets' ? (
              /* TAB 1: ALL TICKETS WITH RESPONSIBLE STAFF IDENTIFIER */
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                {/* Left Column: Tickets List */}
                <div className="md:col-span-5 lg:col-span-4 border-r border-zinc-800/80 flex flex-col overflow-hidden bg-zinc-950/40">
                  <div className="p-3 border-b border-zinc-800/80 space-y-2 shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search protocol, client name..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-300 focus:outline-none cursor-pointer"
                      >
                        <option value="all">Status: All</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="waiting_customer">Waiting Cust.</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>

                      <select
                        value={staffFilter}
                        onChange={(e) => setStaffFilter(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-300 focus:outline-none cursor-pointer"
                      >
                        <option value="all">Agent: All</option>
                        <option value="unassigned">⚠️ Unassigned</option>
                        {staffMembers.map(s => (
                          <option key={s.id} value={s.id}>👤 {s.name.split(' ')[0]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Scrollable list */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                    {filteredTickets.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-500">
                        No support tickets matched criteria.
                      </div>
                    ) : (
                      filteredTickets.map((ticket) => {
                        const isSelected = selectedTicket?.id === ticket.id;

                        return (
                          <div
                            key={ticket.id}
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-zinc-850 border-amber-500/50 shadow-md'
                                : 'bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800/70 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-mono text-xs font-bold text-sky-400">
                                {ticket.protocol}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                                {ticket.status}
                              </span>
                            </div>

                            <p className="text-xs text-zinc-200 font-medium truncate mb-1">
                              {ticket.subject}
                            </p>

                            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                              <span className="truncate max-w-[120px] text-zinc-400">
                                {ticket.name}
                              </span>
                              <span className="text-zinc-500 text-[10px]">
                                {ticket.assignedStaffName ? `👤 ${ticket.assignedStaffName}` : '⚠️ Unassigned'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right Column: Ticket Work Area & Moderation */}
                <div className="md:col-span-7 lg:col-span-8 flex flex-col overflow-hidden bg-[#101014]">
                  {selectedTicket ? (
                    <>
                      {/* Ticket Header & Agent Assignment */}
                      <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-base font-bold font-display text-white">
                              {selectedTicket.subject}
                            </span>
                            <span className="text-xs font-mono font-bold text-sky-400">
                              {selectedTicket.protocol}
                            </span>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                              {selectedTicket.priority}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                            <span>Client: <strong>{selectedTicket.name}</strong> ({selectedTicket.email})</span>
                            <span>·</span>
                            <span>Category: {selectedTicket.categoryName || selectedTicket.category}</span>
                          </div>
                        </div>

                        {/* Status & Reassignment Controls */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            value={selectedTicket.status}
                            onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono cursor-pointer"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="waiting_customer">Waiting Customer</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>

                          {/* Requirement 5: Identificar funcionarios responsaveis por cada atendimento */}
                          <select
                            value={selectedTicket.assignedStaffId || ''}
                            onChange={(e) => handleAssignTicket(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono cursor-pointer"
                          >
                            <option value="">Assign Employee</option>
                            {staffMembers.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.role})
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleOpenTicketTranscript(selectedTicket)}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 text-xs font-mono transition-colors cursor-pointer border border-purple-800/50 flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Transcript</span>
                          </button>
                        </div>
                      </div>

                      {/* Messages Thread */}
                      <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto">
                        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2 mr-4">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{selectedTicket.name}</span>
                              <span className="text-zinc-500 text-[10px] font-normal">(Initial Ticket)</span>
                            </span>
                            <span className="text-zinc-500 font-mono text-[11px]">
                              {new Date(selectedTicket.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {selectedTicket.description}
                          </p>
                        </div>

                        {selectedTicket.replies.map((reply) => {
                          const isStaff = reply.sender === 'admin' || reply.sender === 'staff';
                          return (
                            <div
                              key={reply.id}
                              className={`p-4 rounded-xl border space-y-2 ${
                                isStaff
                                  ? 'bg-amber-950/20 border-amber-800/40 ml-4'
                                  : 'bg-zinc-900/80 border-zinc-800 mr-4'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className={`font-semibold flex items-center gap-1.5 ${isStaff ? 'text-amber-300' : 'text-white'}`}>
                                  {isStaff ? (
                                    <>
                                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                                      <span>{reply.senderName}</span>
                                    </>
                                  ) : (
                                    <>
                                      <User className="w-3.5 h-3.5 text-zinc-400" />
                                      <span>{reply.senderName}</span>
                                    </>
                                  )}
                                </span>
                                <span className="text-zinc-500 font-mono text-[11px]">
                                  {new Date(reply.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                                {reply.message}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Admin Reply Composer */}
                      <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/60 shrink-0">
                        <form onSubmit={handleSendAdminReply} className="space-y-2">
                          <div className="relative">
                            <textarea
                              rows={2}
                              required
                              value={adminReplyText}
                              onChange={(e) => setAdminReplyText(e.target.value)}
                              placeholder="Reply as Administrator..."
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed"
                            />
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              type="submit"
                              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                            >
                              <span>Send Admin Reply</span>
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-xs p-6">
                      <MessageSquare className="w-10 h-10 mb-3 text-zinc-700" />
                      <p>Select a ticket to review service history and assign staff.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'roles' ? (
              /* TAB: CARGOS & PERMISSÕES (Mini aba minimalista com cargos automáticos e gestão de donos/admins) */
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span>Cargos & Controle de Acesso</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Hierarquia de permissões da Fiveware.cc. Apenas o Dono tem autorização para nomear Administradores.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-[11px] font-mono text-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>Donos do Site: jogadorprincipal3 &amp; otaviocarlos</span>
                  </div>
                </div>

                {/* 4 Cards de Cargos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Card 1: Owner */}
                  <div className="p-4 rounded-xl bg-gradient-to-b from-amber-950/30 to-zinc-950 border border-amber-500/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        Soberano
                      </span>
                      <span className="text-xs">👑</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>Owner (Dono)</span>
                      </h4>
                      <p className="text-[11px] text-amber-200/80 mt-1 leading-relaxed">
                        Exclusivo de <strong className="text-white font-mono">jogadorprincipal3@gmail.com</strong> e <strong className="text-white font-mono">otaviocarlosm75@gmail.com</strong>. Autoridade máxima sobre todo o site e únicos capazes de nomear Admins.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-amber-800/30 text-[10px] text-zinc-400 space-y-1">
                      <div className="flex items-center gap-1 text-amber-300">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Acesso supremo irrevogável</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-300">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Nomeação exclusiva de Admins</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Admin */}
                  <div className="p-4 rounded-xl bg-gradient-to-b from-indigo-950/25 to-zinc-950 border border-indigo-500/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                        Nomeado pelo Dono
                      </span>
                      <span className="text-xs">🛡️</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Admin (Administrador)
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        Cargo restrito. Somente o Dono pode escolher quem recebe Admin para moderar o site, responder tickets e gerenciar categorias.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-indigo-800/30 text-[10px] text-zinc-400 space-y-1">
                      <div className="flex items-center gap-1 text-indigo-300">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Atendimento e resposta de tickets</span>
                      </div>
                      <div className="flex items-center gap-1 text-indigo-300">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Gestão de equipe e avisos</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Customer */}
                  <div className="p-4 rounded-xl bg-gradient-to-b from-sky-950/25 to-zinc-950 border border-sky-500/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                        Automático
                      </span>
                      <span className="text-xs">⭐</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Customer (Cliente)
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        Atribuído <strong>automaticamente</strong> assim que o usuário compra qualquer slot UEFI ou ativa uma serial key na loja.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-sky-800/30 text-[10px] text-zinc-400 space-y-1">
                      <div className="flex items-center gap-1 text-sky-300">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Fila prioritária de atendimento</span>
                      </div>
                      <div className="flex items-center gap-1 text-sky-300">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Acesso ao suporte pós-compra</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Member */}
                  <div className="p-4 rounded-xl bg-gradient-to-b from-zinc-900/60 to-zinc-950 border border-zinc-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
                        Automático
                      </span>
                      <span className="text-xs">👤</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Member (Membro)
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        Atribuído <strong>automaticamente</strong> a todos que se registram no site com uma conta do Discord existente conectada.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-400 space-y-1">
                      <div className="flex items-center gap-1 text-zinc-300">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Abertura de tickets (cooldown 35m)</span>
                      </div>
                      <div className="flex items-center gap-1 text-zinc-300">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Navegação completa autorizada</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diretório de Usuários Registrados */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Usuários Registrados ({registeredUsers.length})
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        Apenas contas registradas com Discord podem acessar o site e abrir tickets.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                        <input
                          type="text"
                          value={roleSearchQuery}
                          onChange={(e) => setRoleSearchQuery(e.target.value)}
                          placeholder="Buscar usuário, Discord, email..."
                          className="bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 w-56"
                        />
                      </div>

                      <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[11px]">
                        {(['all', 'owner', 'admin', 'customer', 'member'] as const).map((r) => (
                          <button
                            key={r}
                            onClick={() => setRoleFilter(r)}
                            className={`px-2 py-0.5 rounded capitalize transition-colors cursor-pointer ${
                              roleFilter === r
                                ? 'bg-zinc-800 text-white font-semibold'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tabela minimalista de usuários */}
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 overflow-hidden">
                    {registeredUsers.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-500 space-y-1">
                        <UserCheck className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                        <p className="text-zinc-400 font-medium">Nenhum usuário registrado ainda</p>
                        <p className="text-[11px] text-zinc-600">Novos membros aparecerão aqui imediatamente após o registro com Discord.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-800/60">
                        {registeredUsers
                          .filter((u) => {
                            if (roleFilter !== 'all' && u.role !== roleFilter) return false;
                            if (roleSearchQuery.trim()) {
                              const q = roleSearchQuery.toLowerCase().trim();
                              return (
                                u.name.toLowerCase().includes(q) ||
                                u.email.toLowerCase().includes(q) ||
                                u.discordUsername.toLowerCase().includes(q)
                              );
                            }
                            return true;
                          })
                          .map((u) => {
                            const isOwnerAccount = isOwnerEmail(u.email) || u.role === 'owner';
                            const isAdminUser = u.role === 'admin';

                            return (
                              <div
                                key={u.id}
                                className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/30 transition-colors"
                              >
                                <div className="flex items-start sm:items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                                    {u.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-white">{u.name}</span>
                                      <span className="text-[11px] font-mono text-[#5865F2] flex items-center gap-1 bg-[#5865F2]/10 border border-[#5865F2]/20 px-1.5 py-0.2 rounded">
                                        <span>Discord:</span>
                                        <strong>{u.discordUsername}</strong>
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono mt-0.5">
                                      <span>{u.email}</span>
                                      <span>·</span>
                                      <span>Desde {new Date(u.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                                  {/* Badge de Cargo */}
                                  <span
                                    className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold border ${
                                      u.role === 'owner'
                                        ? 'bg-amber-950/70 text-amber-300 border-amber-600/50'
                                        : u.role === 'admin'
                                        ? 'bg-indigo-950/70 text-indigo-300 border-indigo-600/50'
                                        : u.role === 'customer'
                                        ? 'bg-sky-950/70 text-sky-300 border-sky-600/50'
                                        : 'bg-zinc-850 text-zinc-400 border-zinc-700'
                                    }`}
                                  >
                                    {u.role === 'owner' ? '👑 OWNER (DONO)' : u.role.toUpperCase()}
                                  </span>

                                  {/* Controle do Dono para Promover / Revogar Admin */}
                                  {isOwnerAccount ? (
                                    <span className="text-[10px] font-mono text-amber-400/70 px-2 py-1">
                                      Dono Supremo
                                    </span>
                                  ) : isAdminUser ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onUpdateUserRole) {
                                          const fallbackRole = (u.purchasesCount && u.purchasesCount > 0) ? 'customer' : 'member';
                                          onUpdateUserRole(u.id, fallbackRole);
                                          toast({
                                            type: 'info',
                                            title: 'Cargo Revogado',
                                            description: `Cargo de Admin removido de ${u.name}. Retornado a [${fallbackRole.toUpperCase()}].`
                                          });
                                        }
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 border border-zinc-800 hover:border-rose-800/60 text-[11px] font-medium transition-colors cursor-pointer"
                                      title="Apenas o Dono pode revogar Administradores"
                                    >
                                      Remover Admin
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onUpdateUserRole) {
                                          onUpdateUserRole(u.id, 'admin');
                                          toast({
                                            type: 'success',
                                            title: 'Admin Nomeado pelo Dono',
                                            description: `${u.name} agora é Administrador do site.`
                                          });
                                        }
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 hover:text-white border border-indigo-700/60 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                      title="Promover usuário a Administrador do site (Exclusivo do Dono)"
                                    >
                                      <Shield className="w-3 h-3" />
                                      <span>Tornar Admin</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === 'categories' ? (
              /* TAB 2: CATEGORY MANAGEMENT (Requirement 5: Criar, editar e remover categorias) */
              <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Tag className="w-4 h-4 text-sky-400" />
                      <span>Ticket Categories Management</span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Create, customise and manage categories shown to customers when submitting support tickets
                    </p>
                  </div>
                </div>

                {/* Create New Category Form */}
                <form onSubmit={handleCreateCategory} className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-sky-400" />
                    <span>Create New Category</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-zinc-300 font-medium mb-1">
                        Category Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="e.g. Licensing & Serial Keys"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-300 font-medium mb-1">
                        Accent Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newCatColor}
                          onChange={(e) => setNewCatColor(e.target.value)}
                          className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer"
                        />
                        <span className="text-xs font-mono text-zinc-400">{newCatColor}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-300 font-medium mb-1">
                      Description / Guidelines for Client
                    </label>
                    <input
                      type="text"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      placeholder="Brief note on what inquiries belong in this category"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Category</span>
                    </button>
                  </div>
                </form>

                {/* Existing Categories Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                    Active Categories ({categories.length})
                  </h4>

                  <div className="grid grid-cols-1 gap-2.5">
                    {categories.map((cat) => {
                      const isEditing = editingCategoryId === cat.id;
                      const associatedCount = tickets.filter(t => t.category === cat.id).length;

                      return (
                        <div
                          key={cat.id}
                          className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <span
                              className="w-3 h-3 rounded-full mt-1 shrink-0"
                              style={{ backgroundColor: cat.color || '#38bdf8' }}
                            />
                            {isEditing ? (
                              <div className="space-y-2 flex-1">
                                <input
                                  type="text"
                                  value={editCatName}
                                  onChange={(e) => setEditCatName(e.target.value)}
                                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white"
                                />
                                <input
                                  type="text"
                                  value={editCatDesc}
                                  onChange={(e) => setEditCatDesc(e.target.value)}
                                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-zinc-300"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveEditCategory(cat.id)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-xs text-white font-medium"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingCategoryId(null)}
                                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="text-sm font-semibold text-white">{cat.name}</h5>
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                                    {associatedCount} tickets
                                  </span>
                                </div>
                                {cat.description && (
                                  <p className="text-xs text-zinc-400 mt-0.5">{cat.description}</p>
                                )}
                              </div>
                            )}
                          </div>

                          {!isEditing && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingCategoryId(cat.id);
                                  setEditCatName(cat.name);
                                  setEditCatDesc(cat.description || '');
                                }}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="Edit Category"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemoveCategory(cat.id)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                                title="Delete Category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : activeTab === 'staff' ? (
              /* TAB 3: STAFF & PERMISSIONS (Requirement 5: Gerenciar funcionários e atribuir permissões) */
              <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>Support Staff & Permissions</span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Manage team members, roles, ticket assignment responsibilities, and access permissions
                    </p>
                  </div>
                </div>

                {/* Add New Staff Member Form */}
                <form onSubmit={handleAddStaffMember} className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Enrol New Employee / Specialist</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-300 font-medium mb-1">
                        Employee Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        placeholder="e.g. Jordan Cooper"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-300 font-medium mb-1">
                        Employee Email
                      </label>
                      <input
                        type="email"
                        required
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        placeholder="jordan@fiveware.cc"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-300 font-medium mb-1">
                        Assigned Role
                      </label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value as any)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="staff">Staff / General Agent</option>
                        <option value="specialist">Technical Specialist</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Enrol Staff Member</span>
                    </button>
                  </div>
                </form>

                {/* Team Members List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                    Team Directory ({staffMembers.length})
                  </h4>

                  <div className="space-y-3">
                    {staffMembers.map((staff) => {
                      const assignedTickets = tickets.filter(t => t.assignedStaffId === staff.id).length;

                      return (
                        <div
                          key={staff.id}
                          className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 font-bold font-mono">
                                {staff.name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="text-sm font-semibold text-white">{staff.name}</h5>
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                                    staff.role === 'admin'
                                      ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
                                      : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                                  }`}>
                                    {staff.role}
                                  </span>
                                  {staff.active ? (
                                    <span className="text-[10px] font-mono text-emerald-400">● Active</span>
                                  ) : (
                                    <span className="text-[10px] font-mono text-zinc-500">○ Inactive</span>
                                  )}
                                </div>
                                <p className="text-xs text-zinc-400 font-mono">{staff.email} · {assignedTickets} active tickets assigned</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleStaffActive(staff.id)}
                                className="px-2.5 py-1 text-xs font-mono rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
                              >
                                {staff.active ? 'Deactivate' : 'Activate'}
                              </button>
                              {!isOwnerEmail(staff.email) && (
                                <button
                                  onClick={() => handleRemoveStaff(staff.id)}
                                  className="p-1 text-zinc-400 hover:text-rose-400"
                                  title="Remove Employee"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Granular Permissions Checkboxes */}
                          <div className="pt-2 border-t border-zinc-800/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={staff.permissions.canReply}
                                onChange={() => handleTogglePermission(staff.id, 'canReply')}
                                className="rounded border-zinc-700 bg-zinc-900 text-emerald-500"
                              />
                              <span>Reply to Customers</span>
                            </label>

                            <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={staff.permissions.canChangeStatus}
                                onChange={() => handleTogglePermission(staff.id, 'canChangeStatus')}
                                className="rounded border-zinc-700 bg-zinc-900 text-emerald-500"
                              />
                              <span>Change Status</span>
                            </label>

                            <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={staff.permissions.canAssignTickets}
                                onChange={() => handleTogglePermission(staff.id, 'canAssignTickets')}
                                className="rounded border-zinc-700 bg-zinc-900 text-emerald-500"
                              />
                              <span>Reassign Tickets</span>
                            </label>

                            <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={staff.permissions.canManageInternalNotes}
                                onChange={() => handleTogglePermission(staff.id, 'canManageInternalNotes')}
                                className="rounded border-zinc-700 bg-zinc-900 text-emerald-500"
                              />
                              <span>Internal Notes</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : activeTab === 'transcripts' ? (
              /* TAB 4: AUDIT LOGS & TRANSCRIPTS */
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-5xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Archive className="w-4 h-4 text-purple-400" />
                      <span>Audit Transcripts & Archived Enquiries</span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Audit records automatically preserved whenever tickets are concluded or deleted.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <span className="text-xs font-mono text-purple-400 bg-purple-950/40 border border-purple-800/50 px-3 py-1 rounded-lg shrink-0">
                      {transcripts.length} Archived Transcripts
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setAdminConfirmPassword('');
                        setConfirmError('');
                        setShowClearHistoryModal(true);
                      }}
                      className="px-3 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 active:bg-rose-950 text-rose-200 hover:text-white border border-rose-800/70 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                      title="Purge all audit history (Master Admin Only)"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                      <span>Purge History</span>
                    </button>
                  </div>
                </div>

                {transcripts.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                    <FileText className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                    <h4 className="text-sm font-semibold text-white mb-1">No transcripts archived</h4>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto">
                      Whenever support enquiries are concluded, complete immutable transcripts are compiled here for compliance.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {transcripts.map((tr) => (
                      <div
                        key={tr.id}
                        className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                              {tr.protocol}
                            </span>
                            <span className="text-xs font-semibold text-zinc-200">
                              {tr.subject}
                            </span>
                            <span className="text-[10px] font-mono text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800/40">
                              {tr.replies.length + 1} msgs
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                            <span>Client: <strong className="text-zinc-300">{tr.name}</strong> ({tr.email})</span>
                            <span>·</span>
                            <span>Agent: <strong>{tr.assignedStaffName || 'Team'}</strong></span>
                            <span>·</span>
                            <span className="text-zinc-500 font-mono">
                              Opened: {new Date(tr.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setActiveTranscript(tr);
                              setIsTranscriptModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 hover:text-white text-xs font-medium border border-purple-800/60 transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Transcript</span>
                          </button>

                          {onRestoreTicket && (
                            <button
                              onClick={() => onRestoreTicket(tr)}
                              title="Restore enquiry to active support queue"
                              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-sky-400 text-xs font-medium border border-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* TAB 5: SITE CONTROLS */
              <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full space-y-6">
                <form onSubmit={handleSaveSiteControls} className="space-y-6">
                  {/* Global Broadcast Announcement Banner */}
                  <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                          <Megaphone className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">
                            Site-wide Announcement Banner
                          </h3>
                          <p className="text-xs text-zinc-400">
                            Display a prominent broadcast ribbon at the top of every page
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bannerEnabled}
                          onChange={(e) => setBannerEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                      </label>
                    </div>

                    {bannerEnabled && (
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-xs text-zinc-300 mb-1 font-medium">
                            Announcement Copy:
                          </label>
                          <input
                            type="text"
                            value={bannerMessage}
                            onChange={(e) => setBannerMessage(e.target.value)}
                            placeholder="e.g. ⚡ Support specialists online 24/7 for order and license assistance."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-zinc-300 mb-1 font-medium">
                            Banner Severity:
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['info', 'warning', 'success'] as const).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setBannerType(t)}
                                className={`py-2 px-3 rounded-lg text-xs font-mono capitalize transition-all cursor-pointer ${
                                  bannerType === t
                                    ? 'bg-zinc-800 border-amber-500 text-white border'
                                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* System Status Controls */}
                  <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          Footer Operational Status
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Customise the operational badge copy in the footer
                        </p>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={statusText}
                      onChange={(e) => setStatusText(e.target.value)}
                      placeholder="e.g. Status: Operational · Node Cluster Online"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
                    />
                  </div>

                  {/* Reset Tickets Button */}
                  <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Clear Enquiries Queue
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        Resets live enquiries to an empty clean queue
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onResetTickets}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono border border-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Clear Queue</span>
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md"
                    >
                      Save Global Settings
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Transcript Viewer Modal */}
      <TranscriptViewerModal
        isOpen={isTranscriptModalOpen}
        onClose={() => setIsTranscriptModalOpen(false)}
        transcript={activeTranscript}
        onRestoreTicket={onRestoreTicket}
      />

      {/* Clear Ticket History Confirmation Modal */}
      <AnimatePresence>
        {showClearHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearHistoryModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-rose-900/60 p-6 shadow-2xl z-10 text-left"
            >
              <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Purge Audit History</h3>
                    <p className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-semibold">
                      Restricted Access: Administrators Only
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowClearHistoryModal(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmClearHistory} className="mt-4 space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  This action irreversibly removes all archived transcripts and historical records.
                </p>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-200">
                    Enter master security key (048):
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                    <input
                      type="password"
                      value={adminConfirmPassword}
                      onChange={(e) => {
                        setAdminConfirmPassword(e.target.value);
                        setConfirmError('');
                      }}
                      placeholder="Security key"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-600 font-mono tracking-widest"
                      autoFocus
                    />
                  </div>
                  {confirmError && (
                    <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{confirmError}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowClearHistoryModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm & Purge</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
