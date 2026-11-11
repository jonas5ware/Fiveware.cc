import React, { useState, useEffect } from 'react';
import { Navbar, NavTabId } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { BackgroundParticles } from './components/common/BackgroundParticles';
import { ToastProvider, useToast } from './components/common/Toast';
import { LoginModal } from './components/auth/LoginModal';
import { AdminPasswordModal } from './components/admin/AdminPasswordModal';
import { AdminPanelModal } from './components/admin/AdminPanelModal';
import { StaffDashboardModal } from './components/staff/StaffDashboardModal';
import { HeroSection } from './components/sections/HeroSection';
import { AppsSection } from './components/sections/AppsSection';
import { SupportSection } from './components/sections/SupportSection';
import { CleanersSection } from './components/sections/CleanersSection';
import { DiscordSection } from './components/sections/DiscordSection';
import { MyTicketsSection } from './components/sections/MyTicketsSection';
import { FaqSection } from './components/sections/FaqSection';
import { ProductsSection } from './components/sections/ProductsSection';
import { FloatingSupportChat } from './components/chat/FloatingSupportChat';
import { ShieldCheck, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, TicketReply, TicketAttachment, TicketTranscript, TicketCategory, StaffMember, InternalNote, RegisteredUser, SiteRole } from './types';
import { INITIAL_TICKET_CATEGORIES, INITIAL_STAFF_MEMBERS } from './data/ticketCategories';
import { 
  auth, 
  logoutUser, 
  onAuthStateChanged, 
  logSecurityEvent, 
  type FirebaseUser,
  listenToAllTickets,
  updateTicketInFirestore,
  addTicketReplyInFirestore
} from './lib/firebase';

// Initial tickets strictly clean and empty - no random mock tickets
const INITIAL_TICKETS: Ticket[] = [];

// Designated Owners according to specification
export const OWNER_EMAILS = [
  'jogadorprincipal3@gmail.com',
  'otaviocarlosm75@gmail.com'
];

export const isOwnerEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return OWNER_EMAILS.includes(email.trim().toLowerCase());
};

// Initial Registered Users Directory (Both Owners pre-registered)
const INITIAL_REGISTERED_USERS: RegisteredUser[] = [
  {
    id: 'u-owner-root',
    name: 'jogadorprincipal3',
    email: 'jogadorprincipal3@gmail.com',
    discordUsername: '@jogadorprincipal',
    role: 'owner',
    createdAt: '2026-11-01T00:00:00.000Z',
    hasActivePlan: true,
    purchasesCount: 1
  },
  {
    id: 'u-owner-otavio',
    name: 'otaviocarlosm75',
    email: 'otaviocarlosm75@gmail.com',
    discordUsername: '@otaviocarlos',
    role: 'owner',
    createdAt: '2026-11-01T00:00:00.000Z',
    hasActivePlan: true,
    purchasesCount: 1
  }
];

function MainAppContent() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<NavTabId>('home');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isStaffDashboardOpen, setIsStaffDashboardOpen] = useState(false);

  // Administrative Access States
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  // Floating Customer Support Chat Window State
  const [activeFloatingTicketId, setActiveFloatingTicketId] = useState<string | null>(null);

  // Ticket Categories (Configured & Persisted)
  const [categories, setCategories] = useState<TicketCategory[]>(() => {
    try {
      const saved = localStorage.getItem('devcore_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((c: TicketCategory) => c.id === 'general')) {
          return parsed;
        }
      }
      return INITIAL_TICKET_CATEGORIES;
    } catch {
      return INITIAL_TICKET_CATEGORIES;
    }
  });

  // Staff Members & Roles (Configured & Persisted)
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem('devcore_staff');
      return saved ? JSON.parse(saved) : INITIAL_STAFF_MEMBERS;
    } catch {
      return INITIAL_STAFF_MEMBERS;
    }
  });

  // Site controls
  const [globalBanner, setGlobalBanner] = useState<{
    enabled: boolean;
    message: string;
    type: 'info' | 'warning' | 'success';
  }>(() => {
    try {
      const saved = localStorage.getItem('devcore_banner');
      return saved ? JSON.parse(saved) : { enabled: false, message: '', type: 'info' };
    } catch {
      return { enabled: false, message: '', type: 'info' };
    }
  });

  const [systemStatusText, setSystemStatusText] = useState<string>(() => {
    try {
      return localStorage.getItem('devcore_system_status') || 'Status: Operational';
    } catch {
      return 'Status: Operational';
    }
  });

  // Tickets State: Cleared of all random mock entries
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const saved = localStorage.getItem('devcore_tickets');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filter((t: Ticket) => t.id !== 't-101' && t.id !== 't-102');
      }
    } catch {}
    return INITIAL_TICKETS;
  });

  // Client Ticket IDs: Cleared of mock ticket IDs
  const [clientTicketIds, setClientTicketIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('devcore_client_ticket_ids');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filter((id: string) => id !== 't-101' && id !== 't-102');
      }
    } catch {}
    return [];
  });

  // Transcripts storage for deleted / archived tickets (Admin Exclusive)
  const [transcripts, setTranscripts] = useState<TicketTranscript[]>(() => {
    try {
      const saved = localStorage.getItem('devcore_transcripts');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [isAdminSession, setIsAdminSession] = useState<boolean>(() => {
    try {
      return localStorage.getItem('devcore_admin_session') === 'true';
    } catch {
      return false;
    }
  });

  const [discordUser, setDiscordUser] = useState<{ username: string } | null>(() => {
    try {
      const saved = localStorage.getItem('devcore_discord_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<{ name: string; email: string; role?: SiteRole } | null>(() => {
    try {
      const saved = localStorage.getItem('devcore_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => {
    try {
      const saved = localStorage.getItem('devcore_registered_users');
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const owner of INITIAL_REGISTERED_USERS) {
            const idx = parsed.findIndex((u: RegisteredUser) => u.email.toLowerCase() === owner.email.toLowerCase());
            if (idx === -1) {
              parsed.unshift(owner);
            } else {
              parsed[idx] = { ...parsed[idx], role: 'owner' };
            }
          }
          return parsed;
        }
      }
      return INITIAL_REGISTERED_USERS;
    } catch {
      return INITIAL_REGISTERED_USERS;
    }
  });

  // Account registration and Discord connection verification status
  const isRegisteredWithDiscord = Boolean(user && user.email && discordUser && discordUser.username);
  const [loginPromptReason, setLoginPromptReason] = useState<'purchase' | 'ticket' | 'manual' | null>(null);

  const handleOpenLoginModal = (reason: 'purchase' | 'ticket' | 'manual' = 'manual') => {
    setLoginPromptReason(reason);
    setIsLoginModalOpen(true);
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const cleanEmail = firebaseUser.email || '';
        const isMasterAdmin = isOwnerEmail(cleanEmail);

        // Match existing role from directory
        let userRole: SiteRole = isMasterAdmin ? 'owner' : 'member';
        const found = registeredUsers.find(u => u.email.toLowerCase() === cleanEmail.toLowerCase());
        if (found) userRole = isMasterAdmin ? 'owner' : found.role;

        const userData = {
          name: firebaseUser.displayName || cleanEmail.split('@')[0] || 'Fiveware Member',
          email: cleanEmail,
          role: userRole
        };
        setUser(userData);
        if (isMasterAdmin) {
          setIsAdminSession(true);
          try {
            localStorage.setItem('devcore_admin_session', 'true');
          } catch {}
        } else if (userRole === 'member') {
          // Normal members cannot have an active admin session
          setIsAdminSession(false);
          setIsAdminPanelOpen(false);
          try {
            localStorage.removeItem('devcore_admin_session');
          } catch {}
        }
      }
    });
    return () => unsubscribe();
  }, [registeredUsers]);

  // Persist registered users
  useEffect(() => {
    try {
      localStorage.setItem('devcore_registered_users', JSON.stringify(registeredUsers));
    } catch {}
  }, [registeredUsers]);

  // Cooldown tracker (35 minutes between tickets for non-admin members)
  const [lastTicketTime, setLastTicketTime] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('devcore_last_ticket_time');
      return saved ? parseInt(saved, 10) : null;
    } catch {
      return null;
    }
  });

  const handleResetCooldown = () => {
    setLastTicketTime(null);
    try {
      localStorage.removeItem('devcore_last_ticket_time');
    } catch {}
    toast({
      type: 'info',
      title: 'Rate Limit Reset',
      description: 'The 35-minute enquiry rate limit has been cleared.'
    });
  };

  // Persist tickets
  useEffect(() => {
    try {
      localStorage.setItem('devcore_tickets', JSON.stringify(tickets));
    } catch {}
  }, [tickets]);

  // Persist transcripts
  useEffect(() => {
    try {
      localStorage.setItem('devcore_transcripts', JSON.stringify(transcripts));
    } catch {}
  }, [transcripts]);

  // Persist client ticket ids
  useEffect(() => {
    try {
      localStorage.setItem('devcore_client_ticket_ids', JSON.stringify(clientTicketIds));
    } catch {}
  }, [clientTicketIds]);

  // Persist banner & status
  useEffect(() => {
    try {
      localStorage.setItem('devcore_banner', JSON.stringify(globalBanner));
    } catch {}
  }, [globalBanner]);

  useEffect(() => {
    try {
      localStorage.setItem('devcore_system_status', systemStatusText);
    } catch {}
  }, [systemStatusText]);

  // Real-time synchronization of customer tickets directly with Firestore database
  useEffect(() => {
    const unsubscribe = listenToAllTickets(
      (liveTickets) => {
        if (Array.isArray(liveTickets)) {
          setTickets(liveTickets);
        }
      },
      (error) => {
        console.warn('Firestore tickets sync fallback:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (userData: { name: string; email: string; role?: SiteRole; discordUsername?: string }) => {
    const cleanEmail = userData.email.toLowerCase();
    const isOwner = isOwnerEmail(cleanEmail);
    const effectiveRole: SiteRole = isOwner ? 'owner' : (userData.role || 'member');

    setUser({ ...userData, role: effectiveRole });
    if (userData.discordUsername) {
      setDiscordUser({ username: userData.discordUsername });
    }

    if (isOwner) {
      setIsAdminSession(true);
      try {
        localStorage.setItem('devcore_admin_session', 'true');
      } catch {}
    }

    // Refresh directory from storage
    try {
      const raw = localStorage.getItem('devcore_registered_users');
      if (raw) setRegisteredUsers(JSON.parse(raw));
    } catch {}

    setIsLoginModalOpen(false);
  };

  const handleUpdateUserRole = (userId: string, newRole: SiteRole) => {
    setRegisteredUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.id === userId) {
          if (isOwnerEmail(u.email)) return u; // Owners are protected
          return { ...u, role: newRole };
        }
        return u;
      });
      try {
        localStorage.setItem('devcore_registered_users', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (user) {
      const target = registeredUsers.find(u => u.id === userId);
      if (target && target.email.toLowerCase() === user.email.toLowerCase()) {
        setUser(prev => prev ? { ...prev, role: newRole } : null);
        try {
          const saved = localStorage.getItem('devcore_user');
          if (saved) {
            const parsed = JSON.parse(saved);
            localStorage.setItem('devcore_user', JSON.stringify({ ...parsed, role: newRole }));
          }
        } catch {}
      }
    }
  };

  const handleProductPurchased = (productId: string, productName: string, price: string) => {
    if (!user) return;
    const cleanEmail = user.email.toLowerCase();
    const isOwner = isOwnerEmail(cleanEmail);

    setRegisteredUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.email.toLowerCase() === cleanEmail) {
          const currentRole = u.role;
          const nextRole: SiteRole = isOwner ? 'owner' : (currentRole === 'admin' ? 'admin' : 'customer');
          return {
            ...u,
            role: nextRole,
            purchasesCount: (u.purchasesCount || 0) + 1,
            hasActivePlan: true
          };
        }
        return u;
      });
      try {
        localStorage.setItem('devcore_registered_users', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (!isOwner && user.role !== 'admin') {
      setUser(prev => prev ? { ...prev, role: 'customer' } : null);
      try {
        const saved = localStorage.getItem('devcore_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          localStorage.setItem('devcore_user', JSON.stringify({ ...parsed, role: 'customer' }));
        }
      } catch {}
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}
    setUser(null);
    setDiscordUser(null);
    setIsAdminSession(false);
    setIsAdminPanelOpen(false);
    setIsStaffDashboardOpen(false);
    try {
      localStorage.removeItem('devcore_user');
      localStorage.removeItem('devcore_discord_auth');
      localStorage.removeItem('devcore_admin_session');
    } catch {}
    toast({
      type: 'info',
      title: 'Sessão Encerrada',
      description: 'Você desconectou da sua conta com segurança.'
    });
  };

  const handleVerPlanos = () => {
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Ticket Operations
  const handleTicketCreated = (newTicket: Ticket) => {
    // Non-admins must respect 35-minute cooldown
    if (!isAdminSession && lastTicketTime) {
      const elapsed = Date.now() - lastTicketTime;
      const cooldownMs = 35 * 60 * 1000;
      if (elapsed < cooldownMs) {
        toast({
          type: 'warning',
          title: 'Rate Limit Active',
          description: 'You can only submit one support enquiry every 35 minutes.'
        });
        return;
      }
    }

    const now = Date.now();
    if (!isAdminSession) {
      setLastTicketTime(now);
      try {
        localStorage.setItem('devcore_last_ticket_time', now.toString());
      } catch {}
    }

    setTickets((prev) => [newTicket, ...prev.filter(t => t.id !== newTicket.id)]);
    setClientTicketIds((prev) => [newTicket.id, ...prev.filter(id => id !== newTicket.id)]);
    
    // Automatically launch the modern floating support chat window for the user
    setActiveFloatingTicketId(newTicket.id);

    toast({
      type: 'success',
      title: 'Ticket Registrado',
      description: `Protocolo ${newTicket.protocol} conectado ao suporte em tempo real.`
    });
  };

  const handleUpdateTicket = (updatedTicket: Ticket) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
    );
    updateTicketInFirestore(updatedTicket.id, updatedTicket).catch(console.error);
  };

  const handleDeleteTicket = (ticketId: string) => {
    const target = tickets.find((t) => t.id === ticketId);
    if (target) {
      const newTranscript: TicketTranscript = {
        id: `tr-${Date.now()}`,
        ticketId: target.id,
        protocol: target.protocol,
        name: target.name,
        email: target.email,
        subject: target.subject,
        priority: target.priority,
        description: target.description,
        createdAt: target.createdAt,
        closedAt: new Date().toISOString(),
        closedReason: target.closedReason || 'Archived by Administrator',
        deletedAt: new Date().toISOString(),
        replies: target.replies,
        attachments: target.attachments
      };
      setTranscripts((prev) => [newTranscript, ...prev]);
    }

    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    setClientTicketIds((prev) => prev.filter((id) => id !== ticketId));
    toast({
      type: 'info',
      title: 'Enquiry Archived',
      description: 'The enquiry has been archived to the permanent audit transcript archive.'
    });
  };

  const handleRestoreTicket = (transcript: TicketTranscript) => {
    const restoredTicket: Ticket = {
      id: transcript.ticketId || `t-${Date.now()}`,
      protocol: transcript.protocol,
      name: transcript.name,
      email: transcript.email,
      subject: transcript.subject,
      category: transcript.category || 'other',
      categoryName: transcript.categoryName || 'Other Inquiries',
      priority: transcript.priority,
      description: transcript.description,
      status: 'open',
      createdAt: transcript.createdAt,
      lastActivityAt: new Date().toISOString(),
      replies: transcript.replies,
      attachments: transcript.attachments
    };

    setTickets((prev) => [restoredTicket, ...prev.filter((t) => t.id !== restoredTicket.id)]);
    setClientTicketIds((prev) => Array.from(new Set([...prev, restoredTicket.id])));

    toast({
      type: 'success',
      title: 'Enquiry Restored',
      description: `Support protocol ${restoredTicket.protocol} reopened and returned to active queue.`
    });
  };

  const handleResetTickets = () => {
    setTickets(INITIAL_TICKETS);
    setClientTicketIds([]);
    toast({
      type: 'success',
      title: 'Queue Reset',
      description: 'Support queue reset to clean empty state.'
    });
  };

  const handleClearTicketHistory = (options?: { includeClosedTickets?: boolean }) => {
    // 1. Clear all transcripts
    setTranscripts([]);
    try {
      localStorage.removeItem('devcore_transcripts');
    } catch {}

    // 2. If option to include closed tickets is true, remove closed tickets from active tickets list
    if (options?.includeClosedTickets) {
      setTickets((prev) => prev.filter((t) => t.status !== 'closed' && t.status !== 'fechado'));
    }

    toast({
      type: 'success',
      title: 'Audit History Cleared',
      description: 'All moderation transcripts and archived records were successfully purged by administrator.'
    });
  };

  const handleAddClientReply = (ticketId: string, message: string, attachments?: TicketAttachment[]) => {
    const now = new Date().toISOString();
    const reply: TicketReply = {
      id: `r-${Date.now()}`,
      sender: 'user',
      senderName: user?.name || 'Cliente',
      message,
      timestamp: now,
      ...(attachments && attachments.length > 0 ? { attachments } : {})
    };

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          lastActivityAt: now,
          status: 'open',
          unreadByStaff: true,
          unreadByCustomer: false,
          replies: [...t.replies, reply]
        };
      })
    );

    addTicketReplyInFirestore(ticketId, reply).catch(console.error);
  };

  const handleCloseTicketFromClient = (ticketId: string) => {
    const targetTicket = tickets.find(t => t.id === ticketId);
    const now = new Date().toISOString();

    if (targetTicket) {
      const newTr: TicketTranscript = {
        id: `tr-${targetTicket.id}`,
        ticketId: targetTicket.id,
        protocol: targetTicket.protocol,
        name: targetTicket.name,
        email: targetTicket.email,
        subject: targetTicket.subject,
        category: targetTicket.category,
        categoryName: targetTicket.categoryName,
        priority: targetTicket.priority,
        description: targetTicket.description,
        assignedStaffName: targetTicket.assignedStaffName,
        createdAt: targetTicket.createdAt,
        closedAt: now,
        closedReason: 'encerrado pelo cliente',
        replies: targetTicket.replies,
        attachments: targetTicket.attachments
      };
      setTranscripts(prev => [newTr, ...prev.filter(x => x.ticketId !== ticketId)]);
    }

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'closed' as const,
              closedReason: 'encerrado pelo cliente',
              lastActivityAt: now
            }
          : t
      )
    );

    updateTicketInFirestore(ticketId, {
      status: 'closed',
      closedReason: 'encerrado pelo cliente',
      lastActivityAt: now
    }).catch(console.error);

    toast({
      type: 'info',
      title: 'Ticket Concluído',
      description: 'O atendimento foi encerrado e salvo nos transcripts.'
    });
  };

  const handleSimulateInactivity = (ticketId: string) => {
    const elevenMinutesAgo = new Date(Date.now() - 11 * 60 * 1000).toISOString();
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              lastActivityAt: elevenMinutesAgo,
              status: 'closed' as const,
              closedReason: 'Automatically concluded after 10 minutes of dormancy'
            }
          : t
      )
    );
    toast({
      type: 'warning',
      title: 'Inactivity Simulated',
      description: 'Enquiry concluded by the inactivity watchdog.'
    });
  };

  // Staff and Admin Resolution
  const isStaff = Boolean(
    isAdminSession ||
    (user && staffMembers.some((s) => s.active && s.email.toLowerCase() === user.email.toLowerCase()))
  );

  const currentStaff = staffMembers.find(
    (s) => user && s.email.toLowerCase() === user.email.toLowerCase()
  ) || (isAdminSession ? staffMembers[0] : null);

  const currentStaffId = currentStaff?.id || 'staff-master-admin';

  const handleUpdateCategories = (newCategories: TicketCategory[]) => {
    setCategories(newCategories);
    try {
      localStorage.setItem('devcore_categories', JSON.stringify(newCategories));
    } catch {}
  };

  const handleUpdateStaffMembers = (newStaff: StaffMember[]) => {
    setStaffMembers(newStaff);
    try {
      localStorage.setItem('devcore_staff', JSON.stringify(newStaff));
    } catch {}
  };

  const handleAddInternalNote = (ticketId: string, noteContent: string) => {
    const authorName = currentStaff?.name || user?.name || 'Staff Member';
    const authorRole = (currentStaff?.role || (isAdminSession ? 'admin' : 'staff')) as 'admin' | 'staff' | 'specialist';
    const authorId = currentStaffId;

    const newNote: InternalNote = {
      id: `note-${Date.now()}`,
      authorId,
      authorName,
      authorRole,
      content: noteContent,
      createdAt: new Date().toISOString()
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              internalNotes: [...(t.internalNotes || []), newNote]
            }
          : t
      )
    );

    toast({
      type: 'success',
      title: 'Internal Note Recorded',
      description: 'Internal note saved. This note is strictly confidential and invisible to the client.'
    });
  };

  const handleAssignTicket = (ticketId: string, staffId: string, staffName: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              assignedStaffId: staffId,
              assignedStaffName: staffName
            }
          : t
      )
    );

    toast({
      type: 'info',
      title: 'Enquiry Reassigned',
      description: `Support enquiry assigned to ${staffName}.`
    });
  };

  // Tickets belonging strictly to current client session (Strict Privacy & Isolation)
  const currentAuthUid = auth.currentUser?.uid;
  const currentUserEmail = user?.email?.trim().toLowerCase();

  const clientTickets = tickets.filter((t) => {
    if (isAdminSession || isOwnerEmail(currentUserEmail)) return true;
    if (currentAuthUid && (t.userId === currentAuthUid || t.user_id === currentAuthUid)) return true;
    if (currentUserEmail && t.email && t.email.trim().toLowerCase() === currentUserEmail) return true;
    if (!currentAuthUid && !currentUserEmail) return clientTicketIds.includes(t.id);
    return false;
  });

  // Transcripts belonging strictly to current client session
  const clientTranscripts = transcripts.filter((tr) => {
    if (isAdminSession || isOwnerEmail(currentUserEmail)) return true;
    if (currentUserEmail && tr.email && tr.email.trim().toLowerCase() === currentUserEmail) return true;
    if (!currentUserEmail) return clientTicketIds.includes(tr.ticketId);
    return false;
  });

  return (
    <div className="relative min-h-screen bg-[#09090b] text-[#f4f4f5] selection:bg-zinc-700/60 selection:text-white flex flex-col font-sans">
      {/* Background canvas */}
      <BackgroundParticles />

      {/* Global Announcement Banner from Admin Panel */}
      {globalBanner.enabled && globalBanner.message && (
        <div
          className={`relative z-45 py-2.5 px-4 text-xs font-medium text-center flex items-center justify-center gap-2 border-b ${
            globalBanner.type === 'warning'
              ? 'bg-amber-950/80 text-amber-200 border-amber-800/60'
              : globalBanner.type === 'success'
              ? 'bg-sky-950/80 text-sky-200 border-zinc-800'
              : 'bg-zinc-900 text-zinc-200 border-zinc-800'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>{globalBanner.message}</span>
        </div>
      )}

      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onActionClick={() => handleOpenLoginModal('manual')}
        user={user}
        onLogout={handleLogout}
        hasClientTickets={clientTickets.length > 0}
        clientTicketCount={clientTickets.filter((t) => t.status !== 'closed' && t.status !== 'fechado').length}
        isStaffOrAdmin={isStaff}
        isAdminSession={isAdminSession}
        unreadStaffTicketsCount={tickets.filter((t) => t.unreadByStaff && t.status !== 'closed' && t.status !== 'fechado').length}
        onOpenStaffPortal={() => setIsStaffDashboardOpen(true)}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onOpenAdminPrompt={() => setIsAdminPasswordModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-20 pb-16">
        <AnimatePresence mode="wait">
          {activeTab === 'home' ? (
            <motion.div
              key="home-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center"
            >
              <HeroSection
                onVerPlanos={handleVerPlanos}
              />
              <FaqSection
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </motion.div>
          ) : activeTab === 'products' ? (
            <motion.div
              key="products-section"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center justify-center my-auto"
            >
              <ProductsSection
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                user={user}
                discordUser={discordUser}
                onRequireAuth={() => handleOpenLoginModal('purchase')}
                onPurchaseCompleted={handleProductPurchased}
              />
            </motion.div>
          ) : activeTab === 'apps' ? (
            <motion.div
              key="apps-section"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center justify-center my-auto"
            >
              <AppsSection />
            </motion.div>
          ) : activeTab === 'support' ? (
            <motion.div
              key="support-section"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center justify-center my-auto"
            >
              <SupportSection
                categories={categories}
                ticketsCount={tickets.length}
                onTicketCreated={handleTicketCreated}
                onNavigateToMyTickets={() => setActiveTab('my-tickets')}
                onOpenFloatingChat={(ticketId) => setActiveFloatingTicketId(ticketId)}
                isAdmin={isAdminSession}
                lastTicketTime={lastTicketTime}
                user={user}
                onOpenLoginModal={() => handleOpenLoginModal('ticket')}
              />
            </motion.div>
          ) : activeTab === 'cleaners' ? (
            <motion.div
              key="cleaners-section"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center justify-center my-auto"
            >
              <CleanersSection />
            </motion.div>
          ) : activeTab === 'discord' ? (
            <motion.div
              key="discord-section"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center justify-center my-auto"
            >
              <DiscordSection />
            </motion.div>
          ) : activeTab === 'my-tickets' ? (
            <motion.div
              key="my-tickets-section"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center justify-center my-auto"
            >
              <MyTicketsSection
                tickets={isAdminSession ? tickets : clientTickets}
                transcripts={isAdminSession ? transcripts : clientTranscripts}
                isAdmin={isAdminSession}
                user={user}
                onOpenFloatingChat={(ticketId) => setActiveFloatingTicketId(ticketId)}
                onNavigateToSupport={() => {
                  setActiveTab('support');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onNavigateToProducts={() => {
                  setActiveTab('products');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onNavigateToHome={() => {
                  setActiveTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onAddClientReply={handleAddClientReply}
                onCloseTicket={handleCloseTicketFromClient}
                onSimulateInactivity={handleSimulateInactivity}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Footer with discrete admin key trigger */}
      <Footer
        onOpenAdminPrompt={() => setIsAdminPasswordModalOpen(true)}
        systemStatusText={systemStatusText}
      />

      {/* Login & Register Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setLoginPromptReason(null);
        }}
        onLoginSuccess={handleLoginSuccess}
        promptReason={loginPromptReason}
      />

      {/* Admin Secret Password Verification Modal (Key: 048) */}
      <AdminPasswordModal
        isOpen={isAdminPasswordModalOpen}
        onClose={() => setIsAdminPasswordModalOpen(false)}
        onAuthenticated={() => {
          setIsAdminSession(true);
          try {
            localStorage.setItem('devcore_admin_session', 'true');
          } catch {}
          setIsAdminPanelOpen(true);
        }}
      />

      {/* Full Admin Management & Site Control Panel - Strictly guarded for verified admin session */}
      {isAdminSession && (
        <AdminPanelModal
          isOpen={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
          tickets={tickets}
          transcripts={transcripts}
          categories={categories}
          staffMembers={staffMembers}
          registeredUsers={registeredUsers}
          onUpdateUserRole={handleUpdateUserRole}
          currentUserEmail={user?.email}
          onRestoreTicket={handleRestoreTicket}
          onUpdateTicket={handleUpdateTicket}
          onDeleteTicket={handleDeleteTicket}
          onResetTickets={handleResetTickets}
          onClearTicketHistory={handleClearTicketHistory}
          onResetCooldown={handleResetCooldown}
          onUpdateCategories={handleUpdateCategories}
          onUpdateStaffMembers={handleUpdateStaffMembers}
          lastTicketTime={lastTicketTime}
          globalBanner={globalBanner}
          onUpdateGlobalBanner={setGlobalBanner}
          systemStatusText={systemStatusText}
          onUpdateSystemStatusText={setSystemStatusText}
        />
      )}

      {/* Staff Support Dashboard Modal - Strictly guarded */}
      {isAdminSession && (
        <StaffDashboardModal
          isOpen={isStaffDashboardOpen}
          onClose={() => setIsStaffDashboardOpen(false)}
          tickets={tickets}
          staffMembers={staffMembers}
          categories={categories}
          currentStaffId={currentStaffId}
          onUpdateTicket={handleUpdateTicket}
          onAddInternalNote={handleAddInternalNote}
          onAssignTicket={handleAssignTicket}
        />
      )}

      {/* Floating Support Chat Widget for real-time customer and administrator conversation */}
      <FloatingSupportChat
        ticketId={activeFloatingTicketId}
        onClose={() => setActiveFloatingTicketId(null)}
        currentUser={user}
        isAdmin={isAdminSession}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainAppContent />
    </ToastProvider>
  );
}
