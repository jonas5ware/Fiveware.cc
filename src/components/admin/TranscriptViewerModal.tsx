import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Clock, 
  User, 
  ShieldCheck, 
  Paperclip,
  RotateCcw
} from 'lucide-react';
import { TicketTranscript } from '../../types';
import { useToast } from '../common/Toast';

interface TranscriptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: TicketTranscript | null;
  onRestoreTicket?: (transcript: TicketTranscript) => void;
}

export const TranscriptViewerModal: React.FC<TranscriptViewerModalProps> = ({
  isOpen,
  onClose,
  transcript,
  onRestoreTicket
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !transcript) return null;

  const generatePlainTextTranscript = () => {
    let text = `=====================================================\n`;
    text += `FIVEWARE.CC ENQUIRY AUDIT TRANSCRIPT (CONFIDENTIAL - ADMIN ONLY)\n`;
    text += `=====================================================\n\n`;
    text += `Protocol: ${transcript.protocol}\n`;
    text += `Client: ${transcript.name} (${transcript.email})\n`;
    text += `Subject: ${transcript.subject}\n`;
    text += `Priority: ${transcript.priority.toUpperCase()}\n`;
    text += `Opened At: ${new Date(transcript.createdAt).toUTCString()}\n`;
    text += `Closed At: ${new Date(transcript.closedAt).toUTCString()}\n`;
    if (transcript.closedReason) {
      text += `Closure Reason: ${transcript.closedReason}\n`;
    }
    text += `\n------------------- MESSAGE HISTORY -------------------\n\n`;
    text += `[${new Date(transcript.createdAt).toUTCString()}] ${transcript.name}:\n`;
    text += `${transcript.description}\n`;

    if (transcript.attachments && transcript.attachments.length > 0) {
      text += `[Initial Attachments: ${transcript.attachments.map(a => a.name).join(', ')}]\n`;
    }
    text += `\n`;

    transcript.replies.forEach((r) => {
      text += `[${new Date(r.timestamp).toUTCString()}] ${r.senderName} (${r.sender === 'admin' ? 'STAFF' : 'CLIENT'}):\n`;
      text += `${r.message || '(No text provided)'}\n`;
      if (r.attachments && r.attachments.length > 0) {
        text += `[Attachments: ${r.attachments.map(a => a.name).join(', ')}]\n`;
      }
      text += `\n`;
    });

    text += `=====================================================\n`;
    text += `END OF AUDIT TRANSCRIPT - FIVEWARE.CC ARCHIVE\n`;
    text += `=====================================================\n`;
    return text;
  };

  const handleCopy = () => {
    const text = generatePlainTextTranscript();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      type: 'success',
      title: 'Transcript Copied',
      description: 'Full audit record copied to your clipboard.'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = generatePlainTextTranscript();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${transcript.protocol.replace('#', '')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      type: 'info',
      title: 'Download Initialised',
      description: `File transcript-${transcript.protocol.replace('#', '')}.txt generated.`
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.16 }}
          className="relative w-full max-w-3xl bg-[#0f0f12] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/70 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white font-display">
                    Enquiry Audit Transcript
                  </h3>
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/40">
                    {transcript.protocol}
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-rose-950/40 text-rose-300 border border-rose-800/40 px-2 py-0.5 rounded">
                    Admin Audit Only
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Archived record of client messages, attachments and staff responses
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                title="Copy transcript text"
                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-sky-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownload}
                title="Download TXT record"
                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download TXT</span>
              </button>

              {onRestoreTicket && (
                <button
                  onClick={() => {
                    onRestoreTicket(transcript);
                    onClose();
                  }}
                  title="Reopen enquiry"
                  className="px-2.5 py-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/80 text-xs font-medium text-sky-300 hover:text-sky-200 border border-sky-800/60 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Restore</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Ticket Metadata Bar */}
          <div className="px-4 py-2.5 bg-zinc-950/50 border-b border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-3 text-zinc-400">
              <span className="flex items-center gap-1 text-zinc-200">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                {transcript.name}
              </span>
              <span className="text-zinc-500 font-mono text-[11px]">
                {transcript.email}
              </span>
              <span className="text-zinc-500">·</span>
              <span className="text-zinc-300">
                Subject: <strong>{transcript.subject}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Opened: {new Date(transcript.createdAt).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
              <span>·</span>
              <span className="text-rose-400">
                {transcript.closedReason || 'Concluded/Archived'}
              </span>
            </div>
          </div>

          {/* Transcript Content Feed */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-zinc-950/30">
            {/* Initial Ticket Message */}
            <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-800/60">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{transcript.name}</span>
                  <span className="text-zinc-500 text-[10px] font-normal">(Enquiry Author)</span>
                </span>
                <span className="text-zinc-500 font-mono text-[11px]">
                  {new Date(transcript.createdAt).toUTCString()}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {transcript.description}
              </p>

              {transcript.attachments && transcript.attachments.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-2">
                  {transcript.attachments.map((att) => (
                    <div key={att.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300">
                      <Paperclip className="w-3 h-3 text-zinc-400" />
                      <span className="truncate max-w-[150px]">{att.name}</span>
                      <span className="text-zinc-500 font-mono">({att.size})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Replies */}
            {transcript.replies.map((reply) => {
              const isAdmin = reply.sender === 'admin';
              return (
                <div
                  key={reply.id}
                  className={`p-4 rounded-xl border space-y-2 ${
                    isAdmin
                      ? 'bg-amber-950/20 border-amber-900/30 ml-4 sm:ml-8'
                      : 'bg-zinc-900/70 border-zinc-800 mr-4 sm:mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-800/40">
                    <span className={`font-semibold flex items-center gap-1.5 ${isAdmin ? 'text-amber-300' : 'text-white'}`}>
                      {isAdmin ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                          <span>{reply.senderName} (Staff/Admin)</span>
                        </>
                      ) : (
                        <>
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{reply.senderName}</span>
                        </>
                      )}
                    </span>
                    <span className="text-zinc-500 font-mono text-[11px]">
                      {new Date(reply.timestamp).toUTCString()}
                    </span>
                  </div>

                  {reply.message && (
                    <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                      {reply.message}
                    </p>
                  )}

                  {reply.attachments && reply.attachments.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {reply.attachments.map((att) => (
                        <div key={att.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300">
                          <Paperclip className="w-3 h-3 text-zinc-400" />
                          <span className="truncate max-w-[150px]">{att.name}</span>
                          <span className="text-zinc-500 font-mono">({att.size})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Notice */}
          <div className="p-3 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>Immutable Fiveware.cc Audit Record</span>
            <span className="text-amber-400">Total of {transcript.replies.length + 1} messages</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
