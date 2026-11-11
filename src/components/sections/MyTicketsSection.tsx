import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  BookOpen, 
  ShoppingBag, 
  Users, 
  Megaphone, 
  ArrowLeft, 
  Send, 
  Paperclip, 
  X, 
  Clock, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Crown,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Ticket, TicketStatus, TicketAttachment, TicketTranscript } from '../../types';
import { useToast } from '../common/Toast';
import { TranscriptViewerModal } from '../admin/TranscriptViewerModal';
import { sanitizeInput, auth, isOwnerEmail } from '../../lib/firebase';

export type MyTicketsCategory = 'ticket' | 'tutorial' | 'pedidos' | 'chat_clientes' | 'announc';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: string;
  status: 'confirmed' | 'pending';
  date: string;
  email: string;
  key?: string;
  paymentMethod?: string;
}

interface ClientChatMessage {
  id: string;
  senderName: string;
  senderTag: string;
  role: 'client' | 'admin' | 'owner';
  message: string;
  timestamp: string;
}

interface AnnouncementItem {
  id: string;
  authorName: string;
  authorRole: 'admin' | 'owner';
  title?: string;
  message: string;
  timestamp: string;
  hasClientTag: boolean;
}

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
  const [activeCategory, setActiveCategory] = useState<MyTicketsCategory>('ticket');

  // Ticket chat state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<TicketTranscript | null>(null);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Pedidos state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Chat Clientes state
  const [clientMessages, setClientMessages] = useState<ClientChatMessage[]>([]);
  const [newClientMsg, setNewClientMsg] = useState('');
  const clientChatEndRef = useRef<HTMLDivElement | null>(null);

  // Announc state
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [newAnnouncText, setNewAnnouncText] = useState('');
  const [hasUnreadClientNotification, setHasUnreadClientNotification] = useState(false);

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
  const isOwner = isOwnerEmail(userEmailClean) || user?.role === 'owner';
  const isUserAdmin = isAdmin || user?.role === 'admin' || isOwner;
  const isCustomer = user?.role === 'customer' || user?.role === 'client' || isUserAdmin;

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

  const activeTickets = authorizedTickets.filter((t) => t.status !== 'closed' && t.status !== 'fechado');

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

  // Load orders from localStorage
  const [orders, setOrders] = useState<OrderItem[]>(() => {
    try {
      const saved = localStorage.getItem('fiveware_user_orders');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    // Seed default order if user is customer or owner
    if (isCustomer) {
      return [
        {
          id: 'FW-8941PX',
          productId: 'private-solo-uefi-os',
          productName: 'Private Solo Uefi, OS',
          price: '€185.00',
          status: 'confirmed',
          date: new Date().toISOString(),
          email: userEmailClean || 'cliente@fiveware.cc',
          key: 'FW-UEFI-9821-SOLO-X84',
          paymentMethod: 'Pix Instantâneo'
        }
      ];
    }
    return [];
  });

  // Load and sync Client Chat messages
  useEffect(() => {
    const defaultMessages: ClientChatMessage[] = [
      {
        id: 'msg-1',
        senderName: 'Otavio Carlos',
        senderTag: 'tavao_fw',
        role: 'owner',
        message: 'Bem-vindos ao chat privado de clientes Fiveware! Este canal é 100% exclusivo para quem possui licença ativa.',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 'msg-2',
        senderName: 'ViperX',
        senderTag: 'viper_five',
        role: 'client',
        message: 'A versão UEFI OS no Windows 11 23H2 tá rodando sem delay nenhum. 0 detecção nas streams!',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 'msg-3',
        senderName: 'ShadowOps',
        senderTag: 'shadow_ops',
        role: 'client',
        message: 'Setup remoto foi bem rápido. Recomendo pegarem a key Private Solo, estabilidade surreal.',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ];

    try {
      const saved = localStorage.getItem('fiveware_client_chat_messages');
      if (saved) {
        setClientMessages(JSON.parse(saved));
      } else {
        setClientMessages(defaultMessages);
        localStorage.setItem('fiveware_client_chat_messages', JSON.stringify(defaultMessages));
      }
    } catch {
      setClientMessages(defaultMessages);
    }
  }, []);

  // Load and sync Announcements
  useEffect(() => {
    const defaultAnnouncements: AnnouncementItem[] = [
      {
        id: 'ann-1',
        authorName: 'Otavio Carlos',
        authorRole: 'owner',
        title: 'Atualização de Kernel & Pre-Boot UEFI 2.4',
        message: 'Aviso oficial: Nova build do pre-boot UEFI liberada. Todos os drivers foram recertificados. @client por favor reiniciem seus loaders para carregar os novos hashes.',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
        hasClientTag: true
      },
      {
        id: 'ann-2',
        authorName: 'Admin Team',
        authorRole: 'admin',
        title: 'Manutenção Preventiva de Slots',
        message: 'Slots operando normalmente com 100% de estabilidade. @client caso precisem de reset de HWID, usem a aba Ticket.',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
        hasClientTag: true
      }
    ];

    try {
      const saved = localStorage.getItem('fiveware_announcements');
      if (saved) {
        const parsed: AnnouncementItem[] = JSON.parse(saved);
        setAnnouncements(parsed);
      } else {
        setAnnouncements(defaultAnnouncements);
        localStorage.setItem('fiveware_announcements', JSON.stringify(defaultAnnouncements));
      }
    } catch {
      setAnnouncements(defaultAnnouncements);
    }

    // Check if notification flag is active
    try {
      const notified = localStorage.getItem('fiveware_client_notification_seen');
      if (!notified && isCustomer) {
        setHasUnreadClientNotification(true);
      }
    } catch {}
  }, [isCustomer]);

  // Scroll client chat to bottom
  useEffect(() => {
    if (activeCategory === 'chat_clientes') {
      clientChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [clientMessages, activeCategory]);

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

  const handleSendClientChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientMsg.trim()) return;

    const role: 'client' | 'admin' | 'owner' = isOwner ? 'owner' : (isUserAdmin ? 'admin' : 'client');
    const newMsg: ClientChatMessage = {
      id: `client-msg-${Date.now()}`,
      senderName: displayName,
      senderTag: discordTag,
      role,
      message: sanitizeInput(newClientMsg.trim()),
      timestamp: new Date().toISOString()
    };

    const updated = [...clientMessages, newMsg];
    setClientMessages(updated);
    setNewClientMsg('');
    try {
      localStorage.setItem('fiveware_client_chat_messages', JSON.stringify(updated));
    } catch {}
  };

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncText.trim()) return;

    const containsClientTag = newAnnouncText.includes('@client');
    const newAnnounc: AnnouncementItem = {
      id: `ann-${Date.now()}`,
      authorName: displayName,
      authorRole: isOwner ? 'owner' : 'admin',
      message: sanitizeInput(newAnnouncText.trim()),
      timestamp: new Date().toISOString(),
      hasClientTag: containsClientTag
    };

    const updated = [newAnnounc, ...announcements];
    setAnnouncements(updated);
    setNewAnnouncText('');
    try {
      localStorage.setItem('fiveware_announcements', JSON.stringify(updated));
      if (containsClientTag) {
        localStorage.removeItem('fiveware_client_notification_seen');
        setHasUnreadClientNotification(true);
      }
    } catch {}

    toast({
      type: 'success',
      title: 'Anúncio Publicado',
      description: containsClientTag 
        ? 'Anúncio publicado com sucesso! Notificação enviada para todos os @client.'
        : 'Anúncio oficial publicado no canal de avisos.'
    });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast({
      type: 'success',
      title: 'Key Copiada',
      description: 'Chave de ativação copiada para a área de transferência.'
    });
    setTimeout(() => setCopiedKey(null), 2500);
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

  // Render message text with styled @client highlight
  const renderMessageWithTags = (text: string) => {
    if (!text.includes('@client')) {
      return text;
    }
    const parts = text.split(/(@client)/g);
    return parts.map((part, i) => {
      if (part === '@client') {
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#1d6ee5]/20 text-[#38bdf8] border border-[#1d6ee5]/40 font-mono font-bold text-xs"
          >
            @client
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 text-left">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Sidebar - STRICTLY the 5 requested categories */}
        <aside className="w-full lg:w-60 shrink-0 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase px-3 block">
              Menu Principal
            </span>

            {/* As 5 categorias obrigatórias pedidas pelo usuário */}
            <nav className="space-y-1">
              {/* 1. Ticket */}
              <button
                type="button"
                onClick={() => setActiveCategory('ticket')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all text-left cursor-pointer ${
                  activeCategory === 'ticket' 
                    ? 'bg-white/[0.08] text-white font-semibold shadow-sm' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${activeCategory === 'ticket' ? 'text-[#38bdf8]' : 'text-zinc-400'}`} />
                  <span>Ticket</span>
                </div>
                {activeTickets.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-bold">
                    {activeTickets.length}
                  </span>
                )}
              </button>

              {/* 2. Tutorial */}
              <button
                type="button"
                onClick={() => setActiveCategory('tutorial')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left cursor-pointer ${
                  activeCategory === 'tutorial' 
                    ? 'bg-white/[0.08] text-white font-semibold shadow-sm' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <BookOpen className={`w-4 h-4 shrink-0 ${activeCategory === 'tutorial' ? 'text-[#38bdf8]' : 'text-zinc-400'}`} />
                <span>Tutorial</span>
              </button>

              {/* 3. Pedidos */}
              <button
                type="button"
                onClick={() => setActiveCategory('pedidos')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all text-left cursor-pointer ${
                  activeCategory === 'pedidos' 
                    ? 'bg-white/[0.08] text-white font-semibold shadow-sm' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className={`w-4 h-4 shrink-0 ${activeCategory === 'pedidos' ? 'text-[#38bdf8]' : 'text-zinc-400'}`} />
                  <span>Pedidos</span>
                </div>
                {orders.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-bold">
                    {orders.length}
                  </span>
                )}
              </button>

              {/* 4. Chat clientes */}
              <button
                type="button"
                onClick={() => setActiveCategory('chat_clientes')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all text-left cursor-pointer ${
                  activeCategory === 'chat_clientes' 
                    ? 'bg-white/[0.08] text-white font-semibold shadow-sm' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className={`w-4 h-4 shrink-0 ${activeCategory === 'chat_clientes' ? 'text-[#38bdf8]' : 'text-zinc-400'}`} />
                  <span>Chat clientes</span>
                </div>
                {!isCustomer && (
                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                )}
              </button>

              {/* 5. Announc */}
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('announc');
                  setHasUnreadClientNotification(false);
                  try {
                    localStorage.setItem('fiveware_client_notification_seen', 'true');
                  } catch {}
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all text-left cursor-pointer ${
                  activeCategory === 'announc' 
                    ? 'bg-white/[0.08] text-white font-semibold shadow-sm' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Megaphone className={`w-4 h-4 shrink-0 ${activeCategory === 'announc' ? 'text-[#38bdf8]' : 'text-zinc-400'}`} />
                  <span>Announc</span>
                </div>
                {hasUnreadClientNotification && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Bottom user profile & back button */}
          <div className="pt-8 border-t border-zinc-800/60 space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold text-xs shadow-inner overflow-hidden shrink-0">
                <span>{displayName.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white truncate">{displayName}</h4>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {isOwner
                    ? '👑 Owner'
                    : isUserAdmin
                    ? '🛡️ Admin'
                    : isCustomer
                    ? '⭐ Client'
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

        {/* Right Main Content Area */}
        <main className="flex-1 w-full space-y-6">
          {/* Top User Summary Card */}
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
                  Discord: <span className="text-[#5865F2] font-semibold">{discordTag}</span> · Cargo: {isOwner ? 'Owner' : isUserAdmin ? 'Admin' : isCustomer ? 'Client' : 'Member'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isCustomer ? (
                <span className="inline-flex items-center gap-2 text-xs text-emerald-300 font-medium bg-emerald-950/40 border border-emerald-800/50 px-3 py-1.5 rounded-full select-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Plano ativo · Client</span>
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

          {/* Notificação @client no topo quando houver */}
          {hasUnreadClientNotification && (
            <div className="p-4 rounded-xl bg-sky-950/40 border border-[#1d6ee5]/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1d6ee5]/20 flex items-center justify-center text-[#38bdf8] shrink-0">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Comunicado Oficial @client</h4>
                  <p className="text-xs text-zinc-300">A administração publicou um aviso mencionando todos os clientes.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('announc');
                  setHasUnreadClientNotification(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#1d6ee5] hover:bg-[#1a5ec4] text-white text-xs font-semibold cursor-pointer shrink-0"
              >
                Ver Anúncio
              </button>
            </div>
          )}

          {/* =========================================================================
              VIEW 1: TICKET (Chat do ticket que o usuário abriu)
             ========================================================================= */}
          {activeCategory === 'ticket' && (
            <div className="space-y-6">
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

              {/* Lista de tickets ativos */}
              {activeTickets.length === 0 ? (
                <div className="rounded-2xl bg-[#0c0d12]/70 border border-zinc-800/80 py-16 text-center shadow-lg">
                  <p className="text-xs text-zinc-500 font-medium select-none">
                    Nenhum ticket aberto no momento.
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

              {/* Seção de Transcripts */}
              <div className="space-y-3 pt-4 border-t border-zinc-800/60">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Transcripts
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Todo ticket fechado guarda um transcript da conversa inteira.
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
            </div>
          )}

          {/* =========================================================================
              VIEW 2: TUTORIAL (Aba totalmente limpa e sem nada)
             ========================================================================= */}
          {activeCategory === 'tutorial' && (
            <div className="w-full rounded-2xl bg-[#0c0d12] border border-zinc-800/80 min-h-[420px] p-8 flex items-center justify-center text-center shadow-xl">
              <div className="max-w-md space-y-2 select-none opacity-40">
                <BookOpen className="w-10 h-10 mx-auto text-zinc-600 stroke-[1.5]" />
                <p className="text-xs text-zinc-500 font-mono">
                  Tutorial
                </p>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 3: PEDIDOS (Mostra pedido e compras que o usuário já fez ou pendentes)
             ========================================================================= */}
          {activeCategory === 'pedidos' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Meus Pedidos &amp; Licenças
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Histórico de compras, chaves de ativação e pedidos em confirmação
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToProducts && onNavigateToProducts()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#1d6ee5] hover:bg-[#1a5ec4] transition-colors cursor-pointer shrink-0"
                >
                  Comprar novo slot
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="rounded-2xl bg-[#0c0d12] border border-zinc-800/80 p-12 text-center shadow-lg space-y-3">
                  <ShoppingBag className="w-10 h-10 mx-auto text-zinc-600" />
                  <h4 className="text-sm font-semibold text-white">Nenhum pedido registrado</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Você ainda não possui pedidos ou compras registradas nesta conta.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigateToProducts && onNavigateToProducts()}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all cursor-pointer"
                  >
                    Ver slots disponíveis
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="rounded-2xl bg-[#0c0d12] border border-zinc-800/80 p-5 space-y-4 shadow-xl hover:border-zinc-700/80 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold text-sky-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            {ord.id}
                          </span>
                          {ord.status === 'confirmed' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Confirmado · Ativo</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                              <Clock className="w-3 h-3" />
                              <span>Aguardando confirmação</span>
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold text-white font-mono">{ord.price}</span>
                          <span className="text-[11px] text-zinc-400 ml-1">Lifetime</span>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-white">
                            {ord.productName}
                          </h4>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Data do pedido: {new Date(ord.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            {ord.paymentMethod && ` · Método: ${ord.paymentMethod}`}
                          </p>
                        </div>

                        {ord.key && (
                          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-2 px-3">
                            <div className="text-left">
                              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
                                Chave de Ativação
                              </span>
                              <span className="text-xs font-mono font-bold text-sky-400 select-all">
                                {ord.key}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyKey(ord.key!)}
                              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                              title="Copiar Key"
                            >
                              {copiedKey === ord.key ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW 4: CHAT CLIENTES (Chat privado exclusivo para clientes)
             ========================================================================= */}
          {activeCategory === 'chat_clientes' && (
            <div className="space-y-4">
              {!isCustomer ? (
                /* Bloqueado para quem não é cliente */
                <div className="rounded-2xl bg-[#0c0d12] border border-zinc-800/80 p-12 text-center shadow-xl space-y-4 max-w-lg mx-auto my-8">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Chat Privado de Clientes
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                      Este canal de comunicação em tempo real é reservado exclusivamente para membros que já realizaram alguma compra e possuem o cargo de <strong>[CLIENT]</strong> ativo.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => onNavigateToProducts && onNavigateToProducts()}
                      className="px-6 py-3 rounded-xl bg-[#1d6ee5] hover:bg-[#1a5ec4] text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-[#1d6ee5]/20"
                    >
                      Adquirir slot para liberar acesso
                    </button>
                  </div>
                </div>
              ) : (
                /* Desbloqueado para clientes e administração */
                <div className="rounded-2xl bg-[#0c0d12] border border-zinc-800/80 flex flex-col h-[580px] overflow-hidden shadow-2xl">
                  {/* Header do Chat */}
                  <div className="px-5 py-4 border-b border-zinc-800/80 bg-[#0e0f18]/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                          <span>Client Lounge</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-semibold">
                            Exclusivo
                          </span>
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          Chat privado exclusivo para clientes com compras confirmadas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="hidden sm:inline">Online</span>
                    </div>
                  </div>

                  {/* Messages feed */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                    {clientMessages.map((msg) => {
                      const isOwnerMsg = msg.role === 'owner';
                      const isAdminMsg = msg.role === 'admin';
                      return (
                        <div
                          key={msg.id}
                          className="p-3.5 sm:p-4 rounded-xl bg-zinc-950/70 border border-zinc-850 hover:border-zinc-700/60 transition-colors space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white">{msg.senderName}</span>
                              <span className="text-zinc-500 font-mono text-[11px]">@{msg.senderTag}</span>
                              {isOwnerMsg ? (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                                  👑 OWNER
                                </span>
                              ) : isAdminMsg ? (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold">
                                  🛡️ ADMIN
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                                  ⭐ CLIENT
                                </span>
                              )}
                            </div>
                            <span className="text-zinc-500 font-mono text-[11px]">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {renderMessageWithTags(msg.message)}
                          </p>
                        </div>
                      );
                    })}
                    <div ref={clientChatEndRef} />
                  </div>

                  {/* Message Input Form */}
                  <form onSubmit={handleSendClientChat} className="p-3 sm:p-4 border-t border-zinc-800/80 bg-[#090a10]">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newClientMsg}
                        onChange={(e) => setNewClientMsg(e.target.value)}
                        placeholder="Escreva uma mensagem no chat dos clientes..."
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                      />
                      <button
                        type="submit"
                        disabled={!newClientMsg.trim()}
                        className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#1d6ee5] hover:bg-[#1a5ec4] disabled:opacity-40 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shrink-0"
                      >
                        <span>Enviar</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW 5: ANNOUNC (Canal de anúncios onde clientes só visualizam e admins enviam)
             ========================================================================= */}
          {activeCategory === 'announc' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Canal de Anúncios Oficiais</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-sky-400 border border-zinc-800 font-semibold">
                    Broadcast
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Comunicados da equipe de desenvolvimento. Menções com @client disparam avisos para todos os clientes.
                </p>
              </div>

              {/* Formulário de Envio EXCLUSIVO para Admins / Owners */}
              {isUserAdmin && (
                <div className="p-5 rounded-2xl bg-[#0e0f18] border border-[#1d6ee5]/40 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Publicar Novo Anúncio (Painel Admin)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setNewAnnouncText((prev) => (prev ? `${prev} @client ` : '@client '))}
                      className="px-2.5 py-1 rounded-lg bg-[#1d6ee5]/20 hover:bg-[#1d6ee5]/30 border border-[#1d6ee5]/50 text-xs font-mono font-bold text-[#38bdf8] transition-colors cursor-pointer"
                    >
                      + Inserir @client
                    </button>
                  </div>

                  <form onSubmit={handlePostAnnouncement} className="space-y-3">
                    <textarea
                      rows={3}
                      value={newAnnouncText}
                      onChange={(e) => setNewAnnouncText(e.target.value)}
                      placeholder="Escreva a mensagem do anúncio... Use @client para alertar todos os clientes instantaneamente."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#1d6ee5] resize-none"
                    />

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!newAnnouncText.trim()}
                        className="px-5 py-2.5 rounded-xl bg-[#1d6ee5] hover:bg-[#1a5ec4] disabled:opacity-40 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-md"
                      >
                        <span>Publicar Anúncio</span>
                        <Megaphone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Feed de Anúncios (Clientes apenas visualizam) */}
              <div className="space-y-3.5">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className={`p-5 rounded-2xl bg-[#0c0d12] border transition-colors space-y-3 shadow-xl ${
                      ann.hasClientTag ? 'border-[#1d6ee5]/40 bg-[#0c0d16]' : 'border-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#1d6ee5]/20 flex items-center justify-center text-[#38bdf8] shrink-0 font-bold text-xs">
                          {ann.authorRole === 'owner' ? '👑' : '🛡️'}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{ann.authorName}</span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {ann.authorRole === 'owner' ? 'Fiveware Owner' : 'Fiveware Staff'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {ann.hasClientTag && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1d6ee5]/20 text-[#38bdf8] border border-[#1d6ee5]/40 animate-pulse">
                            @client Notified
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-zinc-500">
                          {new Date(ann.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} · {new Date(ann.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                      {renderMessageWithTags(ann.message)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Aviso para clientes comuns de canal somente leitura */}
              {!isUserAdmin && (
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center text-xs text-zinc-500">
                  🔒 Canal somente leitura. Apenas administradores e proprietários Fiveware têm permissão para publicar anúncios oficiais.
                </div>
              )}
            </div>
          )}

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
