import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  CheckCircle2, 
  X, 
  Paperclip, 
  FileText, 
  Clock, 
  AlertTriangle, 
  Lock, 
  ShoppingBag, 
  ShieldAlert, 
  Tag, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Check,
  MessageSquare
} from 'lucide-react';
import { Ticket, TicketAttachment, TicketPriority, TicketCategory, TicketPurchaseInfo } from '../../types';
import { useToast } from '../common/Toast';
import { TICKET_BG_IMAGE } from '../../assets/ticketBgData';
import { sanitizeInput, logSecurityEvent, auth, saveTicketToFirestore } from '../../lib/firebase';
import { INITIAL_TICKET_CATEGORIES, generateTicketProtocol } from '../../data/ticketCategories';

interface SupportSectionProps {
  categories?: TicketCategory[];
  ticketsCount?: number;
  onTicketCreated?: (ticket: Ticket) => void;
  onNavigateToMyTickets?: () => void;
  onOpenFloatingChat?: (ticketId: string) => void;
  isAdmin?: boolean;
  lastTicketTime?: number | null;
  user?: { name: string; email: string; role?: string } | null;
  onOpenLoginModal?: () => void;
}

const DiscordIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const COOLDOWN_DURATION_MS = 35 * 60 * 1000; // 35 minutes cooldown

export const SupportSection: React.FC<SupportSectionProps> = ({ 
  categories = INITIAL_TICKET_CATEGORIES,
  ticketsCount = 0,
  onTicketCreated,
  onNavigateToMyTickets,
  onOpenFloatingChat,
  isAdmin = false,
  lastTicketTime = null,
  user = null,
  onOpenLoginModal
}) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('general');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<Ticket | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Close category dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Purchase linking toggle
  const [linkPurchase, setLinkPurchase] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [productName, setProductName] = useState('Slotted V2');
  const [transactionId, setTransactionId] = useState('');

  // Live timer tick for real-time 35-min countdown
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cooldown calculation: administrators are exempt
  const effectiveLastTime = lastTicketTime !== undefined && lastTicketTime !== null
    ? lastTicketTime
    : (() => {
        try {
          const saved = localStorage.getItem('devcore_last_ticket_time');
          return saved ? parseInt(saved, 10) : null;
        } catch {
          return null;
        }
      })();

  const elapsed = effectiveLastTime ? currentTime - effectiveLastTime : Infinity;
  const isCooldownActive = !isAdmin && effectiveLastTime !== null && elapsed < COOLDOWN_DURATION_MS;
  const remainingMs = isCooldownActive ? COOLDOWN_DURATION_MS - elapsed : 0;
  const remainingMinutes = Math.floor(remainingMs / (60 * 1000));
  const remainingSeconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

  // Discord authentication state
  const [discordUser, setDiscordUser] = useState<{ username: string } | null>(() => {
    try {
      const saved = localStorage.getItem('devcore_discord_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [discordInput, setDiscordInput] = useState('');

  const activeCategories = categories.filter(c => c.isActive !== false && c.id !== 'refunds' && c.name?.toLowerCase() !== 'refunds');
  const selectedCategoryObj = activeCategories.find(c => c.id === category) || activeCategories[0] || {
    id: 'general',
    name: 'General'
  };

  const handleConnectDiscord = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUsername = sanitizeInput(discordInput.trim()) || 'DiscordUser';
    const userObj = { username: cleanUsername.startsWith('@') ? cleanUsername : `@${cleanUsername}` };
    setDiscordUser(userObj);
    localStorage.setItem('devcore_discord_auth', JSON.stringify(userObj));
    if (!name.trim()) {
      setName(userObj.username);
    }
    setShowDiscordModal(false);
    setDiscordInput('');
    toast({
      type: 'success',
      title: 'Discord Connected',
      description: `Authenticated successfully as ${userObj.username}.`
    });
  };

  const handleDisconnectDiscord = () => {
    setDiscordUser(null);
    localStorage.removeItem('devcore_discord_auth');
    toast({
      type: 'info',
      title: 'Discord Disconnected',
      description: 'Discord profile unlinked.'
    });
  };

  const handleFilesSelect = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    const maxFiles = 5;
    if (attachments.length + filesArray.length > maxFiles) {
      toast({
        type: 'warning',
        title: 'Attachment Limit',
        description: `Maximum ${maxFiles} files allowed per enquiry.`
      });
      return;
    }

    filesArray.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          type: 'error',
          title: 'File Exceeds Limit',
          description: `${file.name} exceeds the 10MB file size limit.`
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

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const isRegisteredUser = Boolean(isAdmin || (user && user.email));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforcement: unauthenticated visitors cannot open tickets per specification
    if (!isRegisteredUser) {
      toast({
        type: 'warning',
        title: 'Autenticação Obrigatória',
        description: 'Você precisa entrar ou criar uma conta para abrir tickets de suporte.'
      });
      if (onOpenLoginModal) {
        onOpenLoginModal();
      }
      return;
    }

    // Enforcement: non-admins cannot open another ticket before 35 minutes
    if (isCooldownActive) {
      toast({
        type: 'warning',
        title: 'Rate Limit Active',
        description: 'You can only submit one support enquiry every 35 minutes.'
      });
      return;
    }

    const finalName = user?.name || name.trim() || user?.email?.split('@')[0] || (discordUser?.username ? discordUser.username.replace('@', '') : 'Visitante');
    const finalEmail = user?.email || email.trim() || (discordUser?.username ? `${discordUser.username.replace('@', '').toLowerCase()}@discord.user` : 'suporte@fiveware.cc');
    const finalSubject = sanitizeInput(subject);
    const finalDescription = sanitizeInput(description) || finalSubject;

    if (!finalSubject) {
      toast({
        type: 'error',
        title: 'Subject Required',
        description: 'Please describe the subject of your enquiry.'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUser = auth.currentUser;
      const matchedCat = categories.find(c => c.id === category) || categories[0];
      const protocolNumber = generateTicketProtocol(ticketsCount);

      const purchaseData: TicketPurchaseInfo | undefined = linkPurchase ? {
        orderNumber: sanitizeInput(orderNumber) || `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
        productName: sanitizeInput(productName),
        transactionId: sanitizeInput(transactionId) || undefined,
        purchaseDate: new Date().toISOString(),
        status: 'completed'
      } : undefined;

      const newTicket: Ticket = {
        id: `t-${Date.now()}`,
        protocol: protocolNumber,
        userId: currentUser?.uid || 'anonymous',
        user_id: currentUser?.uid || 'anonymous',
        name: finalName,
        email: finalEmail,
        subject: finalSubject,
        category: category,
        categoryName: matchedCat ? matchedCat.name : 'General',
        priority: priority,
        description: finalDescription,
        status: 'open',
        createdAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        replies: [],
        internalNotes: [],
        ...(purchaseData ? { purchaseInfo: purchaseData } : {}),
        ...(attachments.length > 0 ? { attachments } : {}),
        unreadByStaff: true,
        unreadByCustomer: false
      };

      // Persist directly to real Firestore database
      await saveTicketToFirestore(newTicket);

      // Save ticket id to local client storage so visitors always retain access
      try {
        const saved = localStorage.getItem('devcore_client_ticket_ids');
        const ids: string[] = saved ? JSON.parse(saved) : [];
        if (!ids.includes(newTicket.id)) {
          ids.unshift(newTicket.id);
          localStorage.setItem('devcore_client_ticket_ids', JSON.stringify(ids));
        }
      } catch {}

      if (!isAdmin) {
        const now = Date.now();
        try {
          localStorage.setItem('devcore_last_ticket_time', now.toString());
        } catch {}
      }

      logSecurityEvent('ticket.created', {
        protocol: newTicket.protocol,
        category: newTicket.category,
        priority: newTicket.priority,
        userId: currentUser?.uid || 'anonymous'
      });

      if (onTicketCreated) {
        onTicketCreated(newTicket);
      }
      setSubmittedTicket(newTicket);

      toast({
        type: 'success',
        title: 'Ticket Criado com Sucesso',
        description: `Seu protocolo ${newTicket.protocol} foi registrado no banco de dados.`
      });

      setSubject('');
      setDescription('');
      setName('');
      setEmail('');
      setOrderNumber('');
      setTransactionId('');
      setAttachments([]);
    } catch (err) {
      console.error('Error creating ticket in Firestore:', err);
      toast({
        type: 'error',
        title: 'Erro ao Criar Ticket',
        description: 'Houve uma instabilidade ao salvar no banco de dados. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative w-full max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center">
      {/* Full-bleed wallpaper background exclusively for the Support tab */}
      <div className="fixed inset-0 pointer-events-none select-none -z-10 overflow-hidden">
        <img
          src={TICKET_BG_IMAGE}
          alt="Support Wallpaper"
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          className="w-full h-full object-cover object-center transform-gpu scale-105"
        />
        {/* Soft dark overlays for high contrast and readability */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/40 to-black/90" />
      </div>

      {/* Ticket Panel Container */}
      <div className="relative z-10 w-full space-y-4">
        {submittedTicket ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5 text-center py-5 bg-[#0c0d12]/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-zinc-800/90 shadow-2xl"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-800/90 border border-zinc-700 flex items-center justify-center mx-auto text-sky-400 shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold font-display text-white mb-1 drop-shadow-sm">
                Enquiry Registered Successfully
              </h3>
              <p className="text-xs text-zinc-300">
                We have received your enquiry, <span className="text-white font-medium">{submittedTicket.name}</span>. Our team will respond directly on-site.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#08090d] border border-zinc-800/80 text-left text-xs font-mono space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Protocol ID:</span>
                <span className="text-sky-400 font-bold text-sm tracking-wide">{submittedTicket.protocol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Category:</span>
                <span className="text-zinc-200">{submittedTicket.categoryName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Subject:</span>
                <span className="text-zinc-200 truncate max-w-[260px]">{submittedTicket.subject}</span>
              </div>
              {submittedTicket.purchaseInfo && (
                <div className="flex justify-between pt-1 border-t border-zinc-800 text-emerald-400">
                  <span>Linked Purchase:</span>
                  <span className="truncate max-w-[220px]">{submittedTicket.purchaseInfo.productName} ({submittedTicket.purchaseInfo.orderNumber})</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {onOpenFloatingChat && (
                <button
                  type="button"
                  onClick={() => onOpenFloatingChat(submittedTicket.id)}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-full transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Abrir no Chat Flutuante</span>
                </button>
              )}
              {onNavigateToMyTickets && (
                <button
                  type="button"
                  onClick={onNavigateToMyTickets}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-[#1d6ee5] hover:bg-[#1a5ec4] rounded-full transition-colors cursor-pointer shadow-md"
                >
                  View My Tickets
                </button>
              )}
              <button
                type="button"
                onClick={() => setSubmittedTicket(null)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Open Another Ticket
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Header: Title set to 'Support' and translated to British English */}
            <div className="text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
                Support
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Speak with our team — we reply directly on-site.
              </p>
            </div>

            {/* Cooldown Alert Banner for non-admins if active */}
            {isCooldownActive && (
              <div className="p-3.5 rounded-xl bg-amber-950/85 border border-amber-500/50 backdrop-blur-md space-y-1.5 text-left shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Rate Limit Active</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-700/50 font-bold">
                    35 MINUTES
                  </span>
                </div>

                <p className="text-xs text-amber-100/90 leading-relaxed font-medium">
                  To ensure prompt support for all clients, you may submit one enquiry every 35 minutes.
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-amber-900/40 text-[11px] font-mono">
                  <span className="text-amber-300 flex items-center gap-1.5 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Remaining: {remainingMinutes}m {remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}s</span>
                  </span>

                  {onNavigateToMyTickets && (
                    <button
                      type="button"
                      onClick={onNavigateToMyTickets}
                      className="text-white hover:text-amber-300 underline transition-colors cursor-pointer font-sans text-xs"
                    >
                      View My Tickets
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Ticket Form Panel ("balões do ticket") in British English - always visible */}
            <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800/90 bg-[#0c0d12]/92 backdrop-blur-md p-5 sm:p-7 shadow-2xl space-y-4 text-left">
              {/* Authenticated User Status Strip */}
              {isRegisteredUser && (
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/70 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-zinc-300 font-medium">
                      Conectado como <strong className="text-white">{user?.name || user?.email?.split('@')[0]}</strong>
                    </span>
                    <span className="text-zinc-500 font-mono text-[11px]">({user?.email})</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-sky-300 border border-zinc-700">
                    Cargo: {user?.role ? user.role.toUpperCase() : 'MEMBER'}
                  </span>
                </div>
              )}

                {/* Row 1: Subject & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                  <div className="sm:col-span-8">
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5 text-left">
                      Subject
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="What do you require assistance with?"
                      className="w-full px-4 py-3 rounded-xl bg-[#08090d] border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
                    />
                  </div>

                <div className="sm:col-span-4" ref={categoryDropdownRef}>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 text-left">
                    Category
                  </label>
                  <div className="relative">
                    {/* Trigger button matching screenshot image_637bd61b.png */}
                    <button
                      type="button"
                      onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                      aria-haspopup="listbox"
                      aria-expanded={isCategoryOpen}
                      className={`w-full px-4 py-3 rounded-xl text-sm flex items-center justify-between cursor-pointer transition-all text-left ${
                        isCategoryOpen
                          ? 'bg-[#0c0d14] border-2 border-[#1d6ee5] ring-2 ring-[#1d6ee5]/25 text-white font-bold'
                          : 'bg-[#08090d] border border-zinc-800 text-white hover:border-zinc-700 font-medium'
                      }`}
                    >
                      <span className="truncate">{selectedCategoryObj?.name || 'General'}</span>
                      {isCategoryOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#1d6ee5] stroke-[2.5] shrink-0 ml-2" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 ml-2" />
                      )}
                    </button>

                    {/* Dropdown popover matching screenshot image_637bd61b.png */}
                    <AnimatePresence>
                      {isCategoryOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          role="listbox"
                          className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#0d0f17] border border-zinc-800/90 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl space-y-0.5 overflow-hidden"
                        >
                          {activeCategories.map((cat) => {
                            const isSelected = cat.id === category;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  setCategory(cat.id);
                                  setIsCategoryOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between text-sm transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'text-white font-bold bg-white/[0.04]'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] font-normal'
                                }`}
                              >
                                <span className="truncate">{cat.name}</span>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-[#1d6ee5] stroke-[2.5] shrink-0 ml-2" />
                                )}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Row 2: Message */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 text-left">
                  Message
                </label>
                <textarea
                  rows={5}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in as much detail as possible."
                  className="w-full px-4 py-3.5 rounded-xl bg-[#08090d] border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors resize-none"
                />
              </div>

              {/* Optional Utilities Toolbar: Attachments & Purchase Link */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-zinc-800/60 text-xs">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer py-1 font-medium"
                    title="Attach screenshots or log files"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{attachments.length > 0 ? `${attachments.length} attachment(s)` : 'Attach screenshots'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLinkPurchase(!linkPurchase)}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer py-1 font-medium"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{linkPurchase ? 'Hide purchase' : 'Link purchase'}</span>
                  </button>
                </div>

                {discordUser ? (
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                    <DiscordIcon className="w-3.5 h-3.5 text-[#5865F2]" />
                    <span className="text-zinc-300">{discordUser.username}</span>
                    <button
                      type="button"
                      onClick={handleDisconnectDiscord}
                      className="text-zinc-500 hover:text-zinc-300 ml-1 cursor-pointer"
                      title="Disconnect"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDiscordModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer py-1 font-medium"
                  >
                    <DiscordIcon className="w-3.5 h-3.5 text-[#5865F2]" />
                    <span>Connect Discord</span>
                  </button>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFilesSelect(e.target.files)}
                multiple
                accept="image/*,.pdf,.txt,.log,.zip,.rar"
                className="hidden"
              />

              {/* Attachment Preview Chips */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-[#08090d] border border-zinc-800">
                  {attachments.map((att) => {
                    const isImage = att.type.startsWith('image/');
                    return (
                      <div
                        key={att.id}
                        className="inline-flex items-center gap-2 p-1.5 pr-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs"
                      >
                        {isImage ? (
                          <img
                            src={att.url}
                            alt={att.name}
                            className="w-7 h-7 rounded object-cover"
                          />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-sky-400 ml-1" />
                        )}
                        <div className="flex flex-col text-left">
                          <span className="text-zinc-200 font-medium truncate max-w-[120px] text-[11px]">
                            {att.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {att.size}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="text-zinc-400 hover:text-rose-400 p-0.5 rounded cursor-pointer transition-colors"
                          title="Remove attachment"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Optional Linked Purchase Drawer */}
              {linkPurchase && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3.5 rounded-xl bg-[#08090d] border border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <div>
                    <label className="block text-[11px] text-zinc-300 font-medium mb-1">
                      Order Reference / Code
                    </label>
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="e.g. ORD-98214"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs font-mono focus:outline-none focus:border-zinc-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-300 font-medium mb-1">
                      Purchased Product
                    </label>
                    <select
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-zinc-700"
                    >
                      <option value="Advanced Slot">Advanced Slot (€85.00)</option>
                      <option value="Exclusive Slot">Exclusive Slot (€125.00)</option>
                      <option value="Private Solo Uefi, OS">Private Solo Uefi, OS (€185.00)</option>
                      <option value="Other Product">Other Product</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {/* Submit Action: Blue Pill Button */}
              <div className="pt-2 text-left">
                {isCooldownActive ? (
                  <button
                    type="submit"
                    className="px-7 py-3 rounded-full text-sm font-semibold text-amber-200 bg-amber-950/80 border border-amber-600/50 cursor-pointer shadow-lg inline-flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Please wait {remainingMinutes}m {remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}s</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-7 py-2.5 rounded-full text-sm font-bold text-white bg-[#1d6ee5] hover:bg-[#1a5ec4] active:bg-[#154fa8] transition-all cursor-pointer shadow-md disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>Opening Ticket...</span>
                    ) : (
                      <span>Open Ticket</span>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modal: Connect Discord */}
      <AnimatePresence>
        {showDiscordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl relative"
            >
              <button
                onClick={() => setShowDiscordModal(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
                  <DiscordIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Connect Discord</h4>
                  <p className="text-[11px] text-zinc-400">Link your handle for accelerated support</p>
                </div>
              </div>

              <form onSubmit={handleConnectDiscord} className="space-y-3 mt-3">
                <div>
                  <label className="block text-[11px] text-zinc-300 font-medium mb-1">
                    Your Discord Tag or Username
                  </label>
                  <input
                    type="text"
                    required
                    value={discordInput}
                    onChange={(e) => setDiscordInput(e.target.value)}
                    placeholder="e.g. @username or handle"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscordInput('FivewareClient');
                      handleConnectDiscord();
                    }}
                    className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Quick Connect
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-lg bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
                  >
                    Connect
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
