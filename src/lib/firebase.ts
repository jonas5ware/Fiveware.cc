import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

export { onAuthStateChanged, type FirebaseUser };
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  addDoc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || '(default)');

// Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Validate Connection to Firestore (Per skill guidelines)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore connection check: client is offline or network restricted.");
    }
  }
}
testConnection();

// Input sanitization against XSS & injection attacks
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

// Security Audit Logger
export async function logSecurityEvent(action: string, details?: Record<string, unknown>) {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, 'audit_logs'), {
      action,
      userId: user ? user.uid : 'anonymous',
      userEmail: user ? user.email : 'unauthenticated',
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      details: details ? JSON.stringify(details) : ''
    });
  } catch {
    // Audit logging fails gracefully in restricted sandboxes
  }
}

export const OWNER_EMAILS = [
  'jogadorprincipal3@gmail.com',
  'otaviocarlosm75@gmail.com'
];

export const isOwnerEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return OWNER_EMAILS.includes(email.trim().toLowerCase());
};

// Client error logger sending to backend /api/logs/error
export async function logClientError(error: unknown, context: string) {
  try {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const userEmail = auth.currentUser?.email || undefined;
    await fetch('/api/logs/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: errorMsg,
        context,
        userEmail
      })
    });
  } catch {
    // Fail silently to not disrupt the UI
  }
}

// Google Sign-In with Security Auditing
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const isOwner = isOwnerEmail(user.email);
    
    // Record user profile in Firestore (never storing Google passwords)
    await setDoc(doc(db, 'users', user.uid), {
      userId: user.uid,
      email: user.email,
      displayName: user.displayName || 'Fiveware Customer',
      photoURL: user.photoURL || '',
      emailVerified: user.emailVerified,
      role: isOwner ? 'admin' : 'client',
      lastLoginAt: new Date().toISOString()
    }, { merge: true });

    await logSecurityEvent('auth.google_login_success', {
      email: user.email,
      emailVerified: user.emailVerified
    });

    return user;
  } catch (error) {
    await logClientError(error, 'auth.google_login');
    await logSecurityEvent('auth.google_login_failure', {
      error: error instanceof Error ? error.message : 'Unknown auth error'
    });
    throw error;
  }
}

// Secure Sign-Out across devices
export async function logoutUser() {
  const user = auth.currentUser;
  if (user) {
    await logSecurityEvent('auth.logout', { uid: user.uid });
  }
  await signOut(auth);
}

// Password Reset / Account Recovery
export async function triggerPasswordReset(email: string) {
  const cleanEmail = sanitizeInput(email);
  if (!cleanEmail) throw new Error("Please provide a valid email address.");
  await sendPasswordResetEmail(auth, cleanEmail);
  await logSecurityEvent('auth.password_reset_requested', { email: cleanEmail });
}

// ==========================================
// REAL-TIME FIRESTORE CUSTOMER SUPPORT TICKETS
// ==========================================
import type { Ticket, TicketReply } from '../types';
import { updateDoc, deleteDoc } from 'firebase/firestore';

export async function saveTicketToFirestore(ticket: Ticket): Promise<void> {
  const ticketRef = doc(db, 'tickets', ticket.id);
  const cleanData = JSON.parse(JSON.stringify(ticket));
  await setDoc(ticketRef, cleanData);
}

export async function updateTicketInFirestore(ticketId: string, updates: Partial<Ticket>): Promise<void> {
  const ticketRef = doc(db, 'tickets', ticketId);
  const cleanUpdates = JSON.parse(JSON.stringify(updates));
  await updateDoc(ticketRef, cleanUpdates);
}

export async function addTicketReplyInFirestore(ticketId: string, reply: TicketReply): Promise<void> {
  const ticketRef = doc(db, 'tickets', ticketId);
  // Strip any undefined properties to prevent Firestore scalar parse error
  const cleanReply = JSON.parse(JSON.stringify(reply));
  const isStaff = reply.sender === 'admin' || reply.sender === 'staff';
  const newStatus = isStaff ? 'waiting_customer' : 'in_progress';
  
  try {
    const snap = await getDocFromServer(ticketRef);
    if (snap.exists()) {
      const data = snap.data() as Ticket;
      const existingReplies = Array.isArray(data.replies) ? data.replies : [];
      const cleanReplies = JSON.parse(JSON.stringify([...existingReplies, cleanReply]));
      
      await updateDoc(ticketRef, {
        replies: cleanReplies,
        lastActivityAt: reply.timestamp,
        status: newStatus,
        unreadByStaff: !isStaff,
        unreadByCustomer: isStaff
      });
      return;
    }
  } catch (err) {
    console.warn("Could not read ticket from server or updateDoc failed, using setDoc with merge:", err);
  }

  // Fallback: If document does not exist yet or updateDoc errored, merge reply with setDoc
  await setDoc(ticketRef, {
    id: ticketId,
    replies: [cleanReply],
    lastActivityAt: reply.timestamp,
    status: newStatus,
    unreadByStaff: !isStaff,
    unreadByCustomer: isStaff
  }, { merge: true });
}

export async function deleteTicketFromFirestore(ticketId: string): Promise<void> {
  const ticketRef = doc(db, 'tickets', ticketId);
  await deleteDoc(ticketRef);
}

export function listenToAllTickets(
  onUpdate: (tickets: Ticket[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const tickets: Ticket[] = [];
      snapshot.forEach((d) => {
        tickets.push(d.data() as Ticket);
      });
      onUpdate(tickets);
    },
    (error) => {
      console.warn('Firestore tickets subscription error (falling back to cached):', error.message);
      if (onError) onError(error);
    }
  );
}

export function listenToTicketById(
  ticketId: string,
  onUpdate: (ticket: Ticket | null) => void
): () => void {
  const ticketRef = doc(db, 'tickets', ticketId);
  return onSnapshot(ticketRef, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data() as Ticket);
    } else {
      onUpdate(null);
    }
  });
}
