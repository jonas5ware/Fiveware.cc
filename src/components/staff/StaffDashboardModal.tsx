import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  X, 
  MessageSquare, 
  Send, 
  Clock, 
  Search, 
  Lock, 
  User, 
  Mail, 
  Tag, 
  FileText, 
  ShoppingBag, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  Plus, 
  ArrowRight,
  EyeOff,
  Bell
} from 'lucide-react';
import { Ticket, TicketStatus, TicketPriority, StaffMember, TicketCategory, InternalNote } from '../../types';
import { useToast } from '../common/Toast';
import { sanitizeInput, logSecurityEvent } from '../../lib/firebase';

interface StaffDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
  staffMembers: StaffMember[];
  categories: TicketCategory[];
  currentStaffId?: string;
  onUpdateTicket: (updatedTicket: Ticket) => void;
  onAddInternalNote: (ticketId: string, noteContent: string) => void;
  onAssignTicket: (ticketId: string, staffId: string, staffName: string) => void;
}

export const StaffDashboardModal: React.FC<StaffDashboardModalProps> = ({
  isOpen,
  onClose,
  tickets,
  staffMembers,
  categories,
  currentStaffId = 'staff-master-admin',
  onUpdateTicket,
  onAddInternalNote,
  onAssignTicket
}) => {
  const { toast } = useToast();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeQueue, setActiveQueue] = useState<'assigned' | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Response & Note inputs
  const [replyMessage, setReplyMessage] = useState('');
  const [newInternalNote, setNewInternalNote] = useState('');
  const [showInternalNotesTab, setShowInternalNotesTab] = useState(false);

  if (!isOpen) return null;

  const currentStaff = staffMembers.find(s => s.id === currentStaffId) || staffMembers[0];

  const filteredTickets = tickets.filter((ticket) => {
    // Queue filter
    if (activeQueue === 'assigned' && ticket.assignedStaffId !== currentStaffId) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      const match = ticket.status === statusFilter || 
        (statusFilter === 'open' && ticket.status === 'aberto') ||
        (statusFilter === 'in_progress' && (ticket.status === 'in_review' || ticket.status === 'em_analise')) ||
        (statusFilter === 'waiting_customer' && (ticket.status === 'responded' || ticket.status === 'respondido')) ||
        (statusFilter === 'closed' && ticket.status === 'fechado');
      if (!match) return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && ticket.category !== categoryFilter) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      const match = ticket.priority === priorityFilter ||
        (priorityFilter === 'urgent' && (ticket.priority === 'critical' || ticket.priority === 'critica')) ||
        (priorityFilter === 'high' && ticket.priority === 'alta') ||
        (priorityFilter === 'normal' && (ticket.priority === 'medium' || ticket.priority === 'media')) ||
        (priorityFilter === 'low' && ticket.priority === 'baixa');
      if (!match) return false;
    }

    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchesSearch = 
        ticket.protocol.toLowerCase().includes(q) ||
        ticket.name.toLowerCase().includes(q) ||
        ticket.email.toLowerCase().includes(q) ||
        ticket.subject.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    return true;
  });

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || filteredTickets[0] || null;

  const handleSendPublicReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    const cleanReply = sanitizeInput(replyMessage.trim());
    const newReply = {
      id: `r-${Date.now()}`,
      sender: 'staff' as const,
      senderName: currentStaff ? currentStaff.name : 'Support Specialist',
      senderId: currentStaffId,
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
    setReplyMessage('');

    toast({
      type: 'success',
      title: 'Reply Sent to Customer',
      description: `Public response dispatched for ticket ${selectedTicket.protocol}.`
    });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newInternalNote.trim()) return;

    const cleanNote = sanitizeInput(newInternalNote.trim());
    onAddInternalNote(selectedTicket.id, cleanNote);
    setNewInternalNote('');

    toast({
      type: 'info',
      title: 'Internal Note Added',
      description: 'Confidential staff note recorded (hidden from customer).'
    });
  };

  const handleStatusChange = (newStatus: TicketStatus) => {
    if (!selectedTicket) return;

    const updated: Ticket = {
      ...selectedTicket,
      status: newStatus,
      lastActivityAt: new Date().toISOString(),
      closedReason: (newStatus === 'closed' || newStatus === 'fechado') ? `Closed by staff: ${currentStaff?.name || 'Support'}` : undefined
    };

    onUpdateTicket(updated);

    toast({
      type: 'success',
      title: 'Status Updated',
      description: `Ticket ${selectedTicket.protocol} set to ${newStatus}.`
    });
  };

  const handleAssignToStaff = (staffId: string) => {
    if (!selectedTicket) return;
    const staff = staffMembers.find(s => s.id === staffId);
    if (!staff) return;

    onAssignTicket(selectedTicket.id, staff.id, staff.name);
    toast({
      type: 'info',
      title: 'Ticket Reassigned',
      description: `Ticket ${selectedTicket.protocol} assigned to ${staff.name}.`
    });
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
      case 'aberto':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-950/60 text-sky-400 border border-sky-800/50">Open</span>;
      case 'in_progress':
      case 'in_review':
      case 'em_analise':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-800/60">In Progress</span>;
      case 'waiting_customer':
      case 'responded':
      case 'respondido':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950/70 text-blue-300 border border-blue-700/60">Waiting Customer</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">Resolved</span>;
      case 'closed':
      case 'fechado':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/60">Closed</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-zinc-400">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'urgent':
      case 'critical':
      case 'critica':
        return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 font-bold uppercase">Urgent</span>;
      case 'high':
      case 'alta':
        return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/50 font-bold uppercase">High</span>;
      case 'normal':
      case 'medium':
      case 'media':
        return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium uppercase">Normal</span>;
      case 'low':
      case 'baixa':
        return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 font-medium uppercase">Low</span>;
      default:
        return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium uppercase">{priority}</span>;
    }
  };

  return (
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
        className="relative w-full max-w-6xl h-[92vh] max-h-[860px] bg-[#0c0c0e] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col"
      >
        {/* Top Staff Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold font-display text-white">
                  Staff Support Portal
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-950/60 text-sky-300 border border-sky-800/50 font-bold">
                  {currentStaff ? currentStaff.name : 'Employee Desk'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Manage assigned tickets, internal confidential notes, and customer enquiries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Queue Selector Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
              <button
                onClick={() => setActiveQueue('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeQueue === 'all'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All Queue ({tickets.length})
              </button>
              <button
                onClick={() => setActiveQueue('assigned')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeQueue === 'assigned'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Assigned to Me ({tickets.filter(t => t.assignedStaffId === currentStaffId).length})
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

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Column: Tickets Queue */}
          <div className="md:col-span-5 lg:col-span-4 border-r border-zinc-800/80 flex flex-col overflow-hidden bg-zinc-950/40">
            {/* Filter Toolbar */}
            <div className="p-3 border-b border-zinc-800/80 space-y-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search protocol, customer..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                />
              </div>

              {/* Filters grid */}
              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-zinc-300 focus:outline-none cursor-pointer truncate"
                >
                  <option value="all">Status: All</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_customer">Waiting Cust.</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                {/* Priority Filter */}
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-zinc-300 focus:outline-none cursor-pointer truncate"
                >
                  <option value="all">Priority: All</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-zinc-300 focus:outline-none cursor-pointer truncate"
                >
                  <option value="all">Category: All</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  No tickets matched current staff filters.
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const isSelected = selectedTicket?.id === ticket.id;

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-zinc-850 border-sky-500/50 shadow-md ring-1 ring-sky-500/30'
                          : 'bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800/70 hover:border-zinc-700'
                      }`}
                    >
                      {/* Unread dot if client sent fresh response */}
                      {ticket.unreadByStaff && (
                        <span className="absolute top-3 right-3 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                        </span>
                      )}

                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-xs font-bold text-sky-400">
                          {ticket.protocol}
                        </span>
                        {getStatusBadge(ticket.status)}
                      </div>

                      <p className="text-xs text-zinc-200 font-medium truncate mb-1">
                        {ticket.subject}
                      </p>

                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-1.5">
                        <span className="truncate max-w-[120px]">{ticket.categoryName || 'Support'}</span>
                        <span>·</span>
                        {getPriorityBadge(ticket.priority)}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono pt-1.5 border-t border-zinc-800/60">
                        <span className="truncate max-w-[130px] text-zinc-400">
                          {ticket.name}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {ticket.assignedStaffName ? `👤 ${ticket.assignedStaffName.split(' ')[0]}` : '⚠️ Unassigned'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Ticket Work Area */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col overflow-hidden bg-[#101014]">
            {selectedTicket ? (
              <>
                {/* Header with quick status & assign tools */}
                <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-base font-bold font-display text-white">
                        {selectedTicket.subject}
                      </span>
                      <span className="text-xs font-mono font-bold text-sky-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        {selectedTicket.protocol}
                      </span>
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1 text-zinc-300">
                        <User className="w-3.5 h-3.5 text-zinc-500" />
                        {selectedTicket.name}
                      </span>
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Mail className="w-3.5 h-3.5 text-zinc-500" />
                        {selectedTicket.email}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                        Category: {selectedTicket.categoryName || selectedTicket.category}
                      </span>
                    </div>
                  </div>

                  {/* Operational Controls: Status & Assignment */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Dropdown */}
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-zinc-500 text-[10px] font-mono">Status:</span>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700 cursor-pointer font-mono font-semibold"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="waiting_customer">Waiting Customer</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    {/* Assignee Dropdown */}
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-zinc-500 text-[10px] font-mono">Assign:</span>
                      <select
                        value={selectedTicket.assignedStaffId || ''}
                        onChange={(e) => handleAssignToStaff(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700 cursor-pointer font-mono"
                      >
                        <option value="">Unassigned</option>
                        {staffMembers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Customer Purchase Info Bar (Requirement 4: Visualizar informacoes relevantes da compra do cliente) */}
                {selectedTicket.purchaseInfo ? (
                  <div className="p-3 bg-zinc-950 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-white">{selectedTicket.purchaseInfo.productName}</span>
                        <span className="text-zinc-400 font-normal">Order: {selectedTicket.purchaseInfo.orderNumber}</span>
                        {selectedTicket.purchaseInfo.amount && (
                          <span className="text-emerald-400 font-bold">${selectedTicket.purchaseInfo.amount} {selectedTicket.purchaseInfo.currency || 'USD'}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500">
                      {selectedTicket.purchaseInfo.transactionId && (
                        <span>TxID: {selectedTicket.purchaseInfo.transactionId}</span>
                      )}
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 uppercase font-bold text-[10px]">
                        {selectedTicket.purchaseInfo.status || 'Verified'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-2 bg-zinc-950/40 border-b border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                    <span>No purchase record linked to this enquiry</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated: Ticket = {
                          ...selectedTicket,
                          purchaseInfo: {
                            orderNumber: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
                            productName: 'Slotted V2 Private Slot',
                            amount: 220,
                            currency: 'USD',
                            purchaseDate: new Date().toISOString(),
                            status: 'completed',
                            transactionId: `TX-${Date.now().toString(36).toUpperCase()}`
                          }
                        };
                        onUpdateTicket(updated);
                        toast({ type: 'success', title: 'Purchase Record Attached' });
                      }}
                      className="text-sky-400 hover:underline cursor-pointer"
                    >
                      + Attach Verified Order
                    </button>
                  </div>
                )}

                {/* Sub-tabs: Customer Conversation vs Confidential Internal Notes */}
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-950/60 border-b border-zinc-800/80 text-xs shrink-0">
                  <button
                    onClick={() => setShowInternalNotesTab(false)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                      !showInternalNotesTab
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Customer Chat ({selectedTicket.replies.length})</span>
                  </button>

                  <button
                    onClick={() => setShowInternalNotesTab(true)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                      showInternalNotesTab
                        ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                        : 'text-zinc-400 hover:text-amber-300'
                    }`}
                  >
                    <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>Internal Notes ({selectedTicket.internalNotes?.length || 0})</span>
                    <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-amber-900/60 text-amber-200">
                      Hidden from Customer
                    </span>
                  </button>
                </div>

                {/* Thread Body */}
                <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto">
                  {!showInternalNotesTab ? (
                    /* Customer & Staff Public Chat */
                    <>
                      {/* Customer Initial Enquiry */}
                      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2 mr-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{selectedTicket.name}</span>
                            <span className="text-zinc-500 text-[10px] font-normal">(Customer)</span>
                          </span>
                          <span className="text-zinc-500 font-mono text-[11px]">
                            {new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          {selectedTicket.description}
                        </p>
                      </div>

                      {/* Replies */}
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
                                    <span>{reply.senderName} (Staff)</span>
                                  </>
                                ) : (
                                  <>
                                    <User className="w-3.5 h-3.5 text-zinc-400" />
                                    <span>{reply.senderName}</span>
                                  </>
                                )}
                              </span>
                              <span className="text-zinc-500 font-mono text-[11px]">
                                {new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {reply.message && (
                              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                                {reply.message}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    /* Confidential Staff Internal Notes */
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-xs text-amber-200 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          <strong>Confidential Staff Ledger:</strong> These notes are restricted to employees and will NEVER be rendered to the customer.
                        </span>
                      </div>

                      {(!selectedTicket.internalNotes || selectedTicket.internalNotes.length === 0) ? (
                        <div className="text-center py-8 text-xs text-zinc-500 font-mono">
                          No internal notes recorded yet for this ticket.
                        </div>
                      ) : (
                        selectedTicket.internalNotes.map((note) => (
                          <div
                            key={note.id}
                            className="p-3.5 rounded-xl bg-amber-950/25 border border-amber-800/50 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                                <Lock className="w-3 h-3 text-amber-400" />
                                <span>{note.authorName}</span>
                                <span className="text-[10px] font-mono uppercase bg-amber-900/60 text-amber-200 px-1 rounded">
                                  {note.authorRole}
                                </span>
                              </span>
                              <span className="text-zinc-500 font-mono text-[11px]">
                                {new Date(note.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-200 leading-relaxed font-mono whitespace-pre-wrap">
                              {note.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Input Area */}
                <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/60 shrink-0">
                  {!showInternalNotesTab ? (
                    <form onSubmit={handleSendPublicReply} className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5 text-sky-400" />
                          <span>Reply to Customer (Public):</span>
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500">
                          Moves ticket status to Waiting for Customer
                        </span>
                      </div>

                      <div className="relative">
                        <textarea
                          rows={2}
                          required
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Provide clear technical instruction or assistance to client..."
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500/50 resize-none leading-relaxed"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <span>Send Customer Response</span>
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleAddNote} className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
                        <span className="font-semibold flex items-center gap-1.5">
                          <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                          <span>Add Confidential Staff Note:</span>
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          Only visible to authorized employees
                        </span>
                      </div>

                      <div className="relative">
                        <textarea
                          rows={2}
                          required
                          value={newInternalNote}
                          onChange={(e) => setNewInternalNote(e.target.value)}
                          placeholder="Record investigation notes, payment verification logs, or instructions for other staff..."
                          className="w-full bg-zinc-900 border border-amber-900/50 rounded-xl p-3 text-xs sm:text-sm text-amber-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none leading-relaxed font-mono"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <span>Save Confidential Note</span>
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-xs p-6">
                <MessageSquare className="w-10 h-10 mb-3 text-zinc-700" />
                <p>Select a ticket from the queue on the left to begin moderation.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
