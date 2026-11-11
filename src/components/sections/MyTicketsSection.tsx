import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Key, 
  ShoppingBag, 
  MessageSquare, 
  Store, 
  CreditCard, 
  ArrowLeft, 
  Send, 
  Paperclip, 
  FileText, 
  X, 
  Clock, 
  Lock, 
  ShieldCheck, 
  Download, 
  Plus,
  CheckCircle2,
  AlertCircle,
  Tag
} from 'lucide-react';
import { Ticket, TicketStatus, TicketAttachment, TicketTranscript } from '../../types';
import { useToast } from '../common/Toast';
import { TranscriptViewerModal } from '../admin/TranscriptViewerModal';
import { sanitizeInput, auth, isOwnerEmail } from '../../lib/firebase';

interface MyTicketsSectionProps {
  tickets: Ticket[];
  transcripts?: TicketTranscript[];
  isAdmin?: boolean;
  isStaff?: boolean;
  user?: { name?: string; email?: string; role?: string } | null;
  onNavigateToSupport: () => void;
  onNavigateToProducts?: () => void;
  onNavigateToHome?: () => void;
  onAddClientReply: (ticketId: string, message: string, attachments?: TicketAttachment[]) => void;
  onCloseTicket: (ticketId: string) => void;
  onSimulateInactivity?: (ticketId: string) => void;
  onMarkAsRead?: (ticketId: string) => void;
  onOpenFloatingChat?: (ticketId: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const MyTicketsSection: React.FC<MyTicketsSectionProps> = ({
  tickets,
  transcripts = [],
  isAdmin = false,
  isStaff = false,
  user,
  onNavigateToSupport,
  onNavigateToProducts,
  onNavigateToHome,
  onAddClientReply,
  onCloseTicket,
  onMarkAsRead,
  onOpenFloatingChat
}) => {
  const { toast } = useToast();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedTranscript, setSelectedTranscript] = useState<TicketTranscript | null>(null);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState<'suporte' | 'conta' | 'ativar' | 'pedidos'>('suporte');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Retrieve Discord username if connected
  const discordUser = (() => {
    try {
      const saved = localStorage.getItem('devcore_discord_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const userEmailClean = user?.email?.trim().toLowerCase() || '';
  const displayName = user?.name || (userEmailClean ? userEmailClean.split('@')[0] : (discordUser?.username ? discordUser.username.replace('@', '') : 'Membro'));
  const discordTag = discordUser?.username ? discordUser.username.replace('@', '') : (userEmailClean ? userEmailClean.split('@')[0] : 'Membro');

  // Strict privacy rule: Regular members ONLY ever see their own tickets
  const clientTicketIds = (() => {
    try {
      const saved = localStorage.getItem('devcore_client_ticket_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })();

  const currentAuthUid = auth.currentUser?.uid;

  const authorizedTickets = isAdmin
    ? tickets
    : tickets.filter((t) => {
        if (currentAuthUid && (t.userId === currentAuthUid || t.user_id === currentAuthUid)) {
          return true;
        }
        if (userEmailClean && t.email) {
          return t.email.trim().toLowerCase() === userEmailClean;
        }
        if (!currentAuthUid && !userEmailClean) {
          return clientTicketIds.includes(t.id);
        }
        return false;
      });

  // Active open tickets (not closed)
  const activeTickets = authorizedTickets.filter((t) => t.status !== 'closed' && t.status !== 'fechado');

  // Closed transcripts: strictly user's own transcripts (members cannot see other members' transcripts)
  const allTranscripts = isAdmin
    ? transcripts
    : transcripts.filter((tr) => {
        if (userEmailClean && tr.email) {
          return tr.email.trim().toLowerCase() === userEmailClean;
        }
        if (!userEmailClean) {
          return clientTicketIds.includes(tr.ticketId);
        }
        return false;
      });

  const selectedTicket = authorizedTickets.find((t) => t.id === selectedTicketId) || null;

  const handleOpenTicketChat = (ticket: Ticket) => {
    if (onOpenFloatingChat) {
      onOpenFloatingChat(ticket.id);
    } else {
      setSelectedTicketId(ticket.id);
    }
    if (ticket.unreadByCustomer && onMarkAsRead) {
      onMarkAsRead(ticket.id);
    }
  };

  const handleOpenTranscript = (tr: TicketTranscript) => {
    setSelectedTranscript(tr);
    setIsTranscriptModalOpen(true);
  };

  const handleFilesSelect = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);
    const maxFiles = 5;
    if (attachments.length + filesArray.length > maxFiles) {
      toast({
        type: 'warning',
        title: 'Limite de Anexos',
        description: `Máximo de ${maxFiles} arquivos por resposta.`
      });
      return;
    }

    filesArray.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          type: 'error',
          title: 'Arquivo muito grande',
          description: `${file.name} ultrapassa o limite de 10MB.`
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const resultUrl = e.target?.result as string;
        const newAttachment: TicketAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: sanitizeInput(file.name),
          size: formatFileSize(file.size),
          type: file.type || 'application/octet-stream',
          url: resultUrl
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    const trimmed = sanitizeInput(replyMessage.trim());
    if (!trimmed && attachments.length === 0) return;

    setSending(true);
    setTimeout(() => {
      const messageToSend = trimmed || (attachments.length > 0 ? 'Arquivo(s) anexado(s)' : '');
      onAddClientReply(selectedTicket.id, messageToSend, attachments);
      setReplyMessage('');
      setAttachments([]);
      setSending(false);
      toast({
        type: 'success',
        title: 'Resposta enviada',
        description: 'Sua resposta foi enviada para a equipe de atendimento.'
      });
    }, 350);
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
      case 'aberto':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-950/80 text-sky-400 border border-sky-800/60">
            Aberto
          </span>
        );
      case 'in_progress':
      case 'in_review':
      case 'em_analise':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
            Em atendimento
          </span>
        );
      case 'waiting_customer':
      case 'responded':
      case 'respondido':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-700/60">
            Aguardando resposta
          </span>
        );
      case 'resolved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            Resolvido
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 text-left">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar matching image_0b053176.png */}
        <aside className="w-full lg:w-60 shrink-0 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* MINHA CONTA */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase px-3 block mb-2">
                Minha Conta
              </span>
              <nav className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSidebarItem('conta');
                    toast({ type: 'info', title: 'Minha Conta', description: `Usuário ativo: ${displayName} (${user?.email || 'Autenticado'})` });
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-left cursor-pointer ${
                    activeSidebarItem === 'conta' ? 'bg-white/[0.08] text-white font-medium' : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span>Conta</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSidebarItem('ativar');
                    toast({ type: 'info', title: 'Ativar Key', description: 'Insira sua key no loader UEFI após a confirmação da compra.' });
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-left cursor-pointer ${
                    activeSidebarItem === 'ativar' ? 'bg-white/[0.08] text-white font-medium' : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <Key className="w-4 h-4 shrink-0" />
                  <span>Ativar key</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSidebarItem('pedidos');
                    if (onNavigateToProducts) onNavigateToProducts();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-left cursor-pointer ${
                    activeSidebarItem === 'pedidos' ? 'bg-white/[0.08] text-white font-medium' : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>Pedidos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSidebarItem('suporte')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-left cursor-pointer ${
                    activeSidebarItem === 'suporte' ? 'bg-white/[0.08] text-white font-medium shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-white shrink-0" />
                  <span>Suporte</span>
                </button>
              </nav>
            </div>

            {/* ATALHOS */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase px-3 block mb-2">
                Atalhos
              </span>
              <nav className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => onNavigateToHome && onNavigateToHome()}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
                >
                  <Store className="w-4 h-4 shrink-0" />
                  <span>Painel da loja</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToProducts && onNavigateToProducts()}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors text-left cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span>Ver planos</span>
                </button>
              </nav>
            </div>
          </div>

            {/* Bottom user profile & back button matching image_0b053176.png */}
          <div className="pt-8 border-t border-zinc-800/60 space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-xs shadow-inner overflow-hidden shrink-0">
                <span>{displayName.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white truncate">{displayName}</h4>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {isOwnerEmail(user?.email) || user?.role === 'owner'
                    ? '👑 Owner'
                    : user?.role === 'admin' || isAdmin
                    ? '🛡️ Admin'
                    : user?.role === 'customer'
                    ? '⭐ Customer'
                    : '👤 Member'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateToHome && onNavigateToHome()}
              className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer px-2 py-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao site</span>
            </button>
          </div>
        </aside>

        {/* Right Main Content Area matching image_0b053176.png */}
        <main className="flex-1 w-full space-y-6">
          {/* Top User Card matching image_0b053176.png */}
          <div className="rounded-2xl bg-[#0c0d12] border border-zinc-800/80 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-base shadow-inner overflow-hidden shrink-0">
                <span>{displayName.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight truncate">
                  {displayName}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Discord {discordTag} · Cargo: {isOwnerEmail(user?.email) || user?.role === 'owner' ? 'Owner' : user?.role ? user.role.toUpperCase() : 'MEMBER'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {user?.role === 'customer' || user?.role === 'owner' ? (
                <span className="inline-flex items-center gap-2 text-xs text-emerald-300 font-medium bg-emerald-950/40 border border-emerald-800/50 px-3 py-1.5 rounded-full select-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Plano ativo · Customer</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-xs text-zinc-300 font-medium bg-[#14151f] border border-zinc-800 px-3 py-1.5 rounded-full select-none">
                  <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                  <span>Sem plano ativo</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => onNavigateToProducts && onNavigateToProducts()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1d6ee5] hover:bg-[#1a5ec4] active:bg-[#154fa8] transition-all cursor-pointer shadow-md"
              >
                Ver planos
              </button>
            </div>
          </div>

          {/* Tickets de suporte section matching image_0b053176.png */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Tickets de suporte
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Fale com nossa equipe aqui no site. Pedidos aprovados também ganham um ticket próprio.
                </p>
              </div>

              <button
                type="button"
                onClick={onNavigateToSupport}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1d6ee5] hover:bg-[#1a5ec4] active:bg-[#154fa8] transition-all cursor-pointer shadow-md self-start sm:self-auto shrink-0 flex items-center gap-1.5"
              >
                <span>Novo ticket</span>
              </button>
            </div>

            {/* Tickets list or empty state matching image_0b053176.png */}
            {activeTickets.length === 0 ? (
              <div className="rounded-2xl bg-[#0c0d12]/70 border border-zinc-800/80 py-16 text-center shadow-lg">
                <p className="text-xs text-zinc-500 font-medium select-none">
                  Nenhum ticket ainda.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="rounded-2xl bg-[#0c0d12] border border-zinc-800/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg hover:border-zinc-700 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-sky-400">
                          {ticket.protocol}
                        </span>
                        {getStatusBadge(ticket.status)}
                        <span className="text-[11px] text-zinc-400 font-medium">
                          · {ticket.categoryName || 'Geral'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate max-w-lg">
                        {ticket.subject}
                      </h4>
                      <p className="text-xs text-zinc-400 font-normal">
                        Aberto em {new Date(ticket.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} · {ticket.replies.length} mensagem(ns)
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenTicketChat(ticket)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1d6ee5] hover:bg-[#1a5ec4] transition-all cursor-pointer shadow-md"
                      >
                        Abrir ticket
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transcripts section matching image_0b053176.png */}
          <div className="space-y-3 pt-2">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Transcripts
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Todo ticket fechado guarda um transcript da conversa inteira, mesmo depois que o ticket é removido.
              </p>
            </div>

            {allTranscripts.length === 0 ? (
              <div className="rounded-2xl bg-[#0c0d12]/70 border border-zinc-800/80 py-10 text-center shadow-lg">
                <p className="text-xs text-zinc-500 font-medium select-none">
                  Nenhum transcript arquivado na sua conta.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {allTranscripts.map((tr) => (
                  <div
                    key={tr.id}
                    className="rounded-2xl bg-[#0c0d12] border border-zinc-800/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg hover:border-zinc-700 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate max-w-lg">
                        {tr.subject}
                      </h4>
                      <p className="text-xs text-zinc-400 font-normal">
                        #{tr.protocol} · {tr.categoryName || 'Geral'} · {tr.closedReason || 'encerrado pela equipe'} · {tr.replies.length} mensagem(ns)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenTranscript(tr)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer shrink-0"
                    >
                      Ler transcript
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Ticket Interactive Chat Drawer / Modal when a ticket is opened */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-3xl rounded-2xl bg-[#0c0d14] border border-zinc-800 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {selectedTicket.protocol}
                    </span>
                    {getStatusBadge(selectedTicket.status)}
                    <span className="text-xs text-zinc-400 font-medium">
                      {selectedTicket.categoryName || 'Geral'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{selectedTicket.subject}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onCloseTicket(selectedTicket.id)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 border border-zinc-800 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Encerrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTicketId(null)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
                {/* Initial Ticket Message */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{selectedTicket.name} (Você)</span>
                    <span className="text-zinc-500 font-mono text-[11px]">
                      {new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Replies */}
                {selectedTicket.replies.map((reply) => {
                  const isStaff = reply.sender === 'admin' || reply.sender === 'staff';
                  return (
                    <div
                      key={reply.id}
                      className={`p-4 rounded-xl border space-y-1.5 ${
                        isStaff ? 'bg-amber-950/20 border-amber-800/40 ml-4' : 'bg-zinc-900/60 border-zinc-800 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-semibold flex items-center gap-1.5 ${isStaff ? 'text-amber-300' : 'text-white'}`}>
                          {isStaff ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                              <span>{reply.senderName} (Suporte Fiveware)</span>
                            </>
                          ) : (
                            <span>{reply.senderName}</span>
                          )}
                        </span>
                        <span className="text-zinc-500 font-mono text-[11px]">
                          {new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                        {reply.message}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-zinc-800/80 space-y-2">
                <textarea
                  rows={2}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Escreva uma resposta para a equipe de suporte..."
                  className="w-full bg-[#08090d] border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 resize-none leading-relaxed"
                />

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition-colors cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{attachments.length > 0 ? `${attachments.length} anexo(s)` : 'Anexar prints'}</span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFilesSelect(e.target.files)}
                    multiple
                    accept="image/*,.pdf,.txt,.log"
                    className="hidden"
                  />

                  <button
                    type="submit"
                    disabled={sending || (!replyMessage.trim() && attachments.length === 0)}
                    className="px-5 py-2 rounded-xl bg-[#1d6ee5] hover:bg-[#1a5ec4] disabled:opacity-50 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <span>{sending ? 'Enviando...' : 'Enviar resposta'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transcript Viewer Modal */}
      <TranscriptViewerModal
        isOpen={isTranscriptModalOpen}
        onClose={() => setIsTranscriptModalOpen(false)}
        transcript={selectedTranscript}
      />
    </div>
  );
};
