import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Minus, 
  Maximize2, 
  Send, 
  Paperclip, 
  ShieldCheck, 
  User, 
  Clock, 
  CheckCircle2, 
  MessageSquare,
  FileText
} from 'lucide-react';
import { Ticket, TicketAttachment, TicketReply } from '../../types';
import { sanitizeInput, listenToTicketById, addTicketReplyInFirestore, auth } from '../../lib/firebase';
import { useToast } from '../common/Toast';

interface FloatingSupportChatProps {
  ticketId: string | null;
  onClose: () => void;
  currentUser?: { name?: string; email?: string } | null;
  isAdmin?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export const FloatingSupportChat: React.FC<FloatingSupportChatProps> = ({
  ticketId,
  onClose,
  currentUser,
  isAdmin = false
}) => {
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real-time changes on this specific ticket via Firestore
  useEffect(() => {
    if (!ticketId) {
      setTicket(null);
      return;
    }

    // Attempt local storage cache first for instant render
    try {
      const saved = localStorage.getItem('devcore_tickets');
      if (saved) {
        const list: Ticket[] = JSON.parse(saved);
        const match = list.find((t) => t.id === ticketId);
        if (match) setTicket(match);
      }
    } catch {}

    // Listen to live updates directly from Firestore database
    const unsubscribe = listenToTicketById(ticketId, (liveTicket) => {
      if (liveTicket) {
        // Enforce strict Row Level Security (RLS) / Ownership Isolation
        const currentUid = auth.currentUser?.uid;
        const currentEmail = auth.currentUser?.email || currentUser?.email;
        const clientTicketIds = (() => {
          try {
            const saved = localStorage.getItem('devcore_client_ticket_ids');
            return saved ? JSON.parse(saved) : [];
          } catch {
            return [];
          }
        })();

        const isDifferentUser = Boolean(
          (liveTicket.userId && currentUid && liveTicket.userId !== currentUid) ||
          (liveTicket.user_id && currentUid && liveTicket.user_id !== currentUid) ||
          (liveTicket.email && currentEmail && liveTicket.email.toLowerCase() !== currentEmail.toLowerCase())
        );

        const isOwner = Boolean(
          !isDifferentUser && (
            (liveTicket.userId && currentUid && liveTicket.userId === currentUid) ||
            (liveTicket.user_id && currentUid && liveTicket.user_id === currentUid) ||
            (liveTicket.email && currentEmail && liveTicket.email.toLowerCase() === currentEmail.toLowerCase()) ||
            (!currentUid && !currentEmail && clientTicketIds.includes(liveTicket.id))
          )
        );

        if (!isAdmin && !isOwner) {
          toast({
            type: 'error',
            title: 'Acesso Negado (RLS)',
            description: 'Você não possui permissão para acessar os dados deste ticket.'
          });
          setTicket(null);
          onClose();
          return;
        }

        setTicket(liveTicket);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [ticketId]);

  // Auto scroll to latest reply on new message
  useEffect(() => {
    if (!isMinimized && ticket) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.replies?.length, isMinimized]);

  if (!ticketId || !ticket) return null;

  const isClosed = ticket.status === 'closed' || ticket.status === 'fechado';

  const handleFilesSelect = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);
    const maxFiles = 3;

    if (attachments.length + filesArray.length > maxFiles) {
      toast({
        type: 'warning',
        title: 'Limite de Anexos',
        description: `Máximo de ${maxFiles} anexos permitidos.`
      });
      return;
    }

    filesArray.forEach((file) => {
      if (file.size > 8 * 1024 * 1024) {
        toast({
          type: 'error',
          title: 'Arquivo Excedeu Limite',
          description: `${file.name} ultrapassa 8MB.`
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const resultUrl = e.target?.result as string;
        const newAttachment: TicketAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isClosed) {
      toast({
        type: 'warning',
        title: 'Ticket Concluído',
        description: 'Este atendimento já foi encerrado.'
      });
      return;
    }

    const cleanText = sanitizeInput(messageText.trim());
    if (!cleanText && attachments.length === 0) return;

    setSending(true);

    const senderRole = isAdmin ? 'admin' : 'user';
    const senderRealName = isAdmin
      ? 'Administrador (Fiveware)'
      : currentUser?.name || ticket.name || 'Cliente';

    const newReply: TicketReply = {
      id: `r-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: senderRole,
      senderName: senderRealName,
      message: cleanText || (attachments.length > 0 ? 'Arquivo(s) anexado(s).' : ''),
      timestamp: new Date().toISOString(),
      ...(attachments.length > 0 ? { attachments: [...attachments] } : {})
    };

    try {
      // 1. Add reply to Firestore
      await addTicketReplyInFirestore(ticket.id, newReply);

      // 2. Also update local tickets cache
      try {
        const saved = localStorage.getItem('devcore_tickets');
        if (saved) {
          const list: Ticket[] = JSON.parse(saved);
          const updated = list.map((t) => {
            if (t.id === ticket.id) {
              return {
                ...t,
                status: isAdmin ? ('waiting_customer' as const) : ('in_progress' as const),
                lastActivityAt: newReply.timestamp,
                replies: [...(t.replies || []), newReply]
              };
            }
            return t;
          });
          localStorage.setItem('devcore_tickets', JSON.stringify(updated));
        }
      } catch {}

      setMessageText('');
      setAttachments([]);
      toast({
        type: 'success',
        title: 'Mensagem Enviada',
        description: 'Sua mensagem foi registrada em tempo real no ticket.'
      });
    } catch (err) {
      console.error('Error sending ticket reply:', err);
      toast({
        type: 'error',
        title: 'Falha ao Enviar',
        description: 'Não foi possível registrar a mensagem. Tente novamente.'
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = () => {
    switch (ticket.status) {
      case 'open':
      case 'aberto':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-950/80 text-sky-300 border border-sky-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span>Aberto</span>
          </span>
        );
      case 'in_progress':
      case 'in_review':
      case 'em_analise':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Em atendimento</span>
          </span>
        );
      case 'waiting_customer':
      case 'responded':
      case 'respondido':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-700/60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Aguardando você</span>
          </span>
        );
      case 'resolved':
      case 'closed':
      case 'fechado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-850 text-zinc-400 border border-zinc-700">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            <span>Fechado</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
            {ticket.status}
          </span>
        );
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none">
      <AnimatePresence mode="wait">
        {isMinimized ? (
          // Minimized Floating Pill / Bubble
          <motion.div
            key="minimized"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="flex items-center gap-3 p-2.5 px-4 rounded-full bg-[#0c0d14]/95 border border-zinc-800 backdrop-blur-xl shadow-2xl cursor-pointer hover:border-zinc-700 transition-all"
            onClick={() => setIsMinimized(false)}
          >
            <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>{ticket.protocol}</span>
                {getStatusBadge()}
              </span>
              <span className="text-[10px] text-zinc-400 truncate max-w-[160px]">
                {ticket.subject}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 rounded-full text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ) : (
          // Full Modern Floating Chat Window
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="w-[94vw] sm:w-[410px] h-[550px] max-h-[82vh] rounded-2xl bg-[#0c0d14]/98 border border-zinc-800/90 shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Window Header */}
            <div className="px-4 py-3 bg-[#11121c]/90 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-sky-400">
                      {ticket.protocol}
                    </span>
                    {getStatusBadge()}
                  </div>
                  <h4 className="text-xs font-bold text-white truncate max-w-[210px] mt-0.5">
                    {ticket.subject}
                  </h4>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  aria-label="Minimizar chat"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar janela flutuante"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conversation Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-left select-text">
              {/* Category & Status Banner */}
              <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-850 text-[11px] text-zinc-400 font-mono flex items-center justify-between">
                <span>Categoria: <strong className="text-zinc-200">{ticket.categoryName || ticket.category}</strong></span>
                <span>{new Date(ticket.createdAt).toLocaleDateString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Original Customer Problem Description */}
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-zinc-800/60">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    <span>{ticket.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">(Ticket inicial)</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {ticket.description}
                </p>

                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-800/60">
                    {ticket.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-950 text-[10px] text-sky-300 border border-zinc-800 hover:border-sky-500/50 transition-colors"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{att.name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Real Conversation Replies */}
              {ticket.replies && ticket.replies.map((reply) => {
                const isStaff = reply.sender === 'admin' || reply.sender === 'staff';
                return (
                  <div
                    key={reply.id}
                    className={`p-3.5 rounded-xl border space-y-1.5 ${
                      isStaff
                        ? 'bg-amber-950/20 border-amber-800/40 ml-4 shadow-sm'
                        : 'bg-zinc-900/80 border-zinc-800 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-800/50">
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
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                      {reply.message}
                    </p>

                    {reply.attachments && reply.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-zinc-800/50">
                        {reply.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-950 text-[10px] text-amber-300 border border-zinc-800 hover:border-amber-500/50 transition-colors"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">{att.name}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Conversation Input Box */}
            <div className="p-3 bg-[#11121c]/95 border-t border-zinc-800/80 shrink-0">
              {isClosed ? (
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center text-xs text-zinc-400 font-mono">
                  Atendimento concluído. Caso precise de nova ajuda, abra um novo ticket.
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-2">
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Escreva sua resposta (Pressione Enter para enviar)..."
                      className="w-full bg-[#08090d] border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500/50 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Attachment Preview Chips */}
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-1.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      {attachments.map((att) => (
                        <span
                          key={att.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 text-[10px] text-zinc-300 border border-zinc-850"
                        >
                          <FileText className="w-2.5 h-2.5 text-sky-400" />
                          <span className="truncate max-w-[100px]">{att.name}</span>
                          <button
                            type="button"
                            onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                            className="text-zinc-500 hover:text-rose-400 ml-1 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-0.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white text-[11px] font-medium border border-zinc-800 transition-colors cursor-pointer"
                    >
                      <Paperclip className="w-3 h-3 text-zinc-400" />
                      <span>Anexar prints</span>
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
                      disabled={sending || (!messageText.trim() && attachments.length === 0)}
                      className="px-4 py-1.5 rounded-xl bg-[#1d6ee5] hover:bg-[#1a5ec4] active:bg-[#154fa8] disabled:opacity-50 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <span>{sending ? 'Enviando...' : 'Responder'}</span>
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
