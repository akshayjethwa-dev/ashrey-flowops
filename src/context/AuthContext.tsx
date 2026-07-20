// src/context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
  writeBatch,
  limit
} from 'firebase/firestore';
import { UserProfile, UserRole, Tenant } from '../types';
import { handleFirestoreError, OperationType } from '../firebaseErrors';

export type AuthStatus = 'loading' | 'unauthenticated' | 'needs_onboarding' | 'active' | 'suspended';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  tenant: Tenant | null;
  authStatus: AuthStatus;
  isSandboxMode: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  switchToSandboxRole: (role: UserRole) => void;
  initializeSandbox: (companyName: string) => void;
  updateProfileLocally: (updates: Partial<UserProfile>) => void;
  setAuthStatus: (status: AuthStatus) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  // Attempt to load sandbox from LocalStorage to persist reload states
  useEffect(() => {
    const sandboxUser = localStorage.getItem('flowops_sandbox_profile');
    const sandboxTenant = localStorage.getItem('flowops_sandbox_tenant');
    if (sandboxUser && sandboxTenant) {
      setProfile(JSON.parse(sandboxUser));
      setTenant(JSON.parse(sandboxTenant));
      setIsSandboxMode(true);
      localStorage.setItem('isSandboxMode', 'true');
      setAuthStatus('active');
    } else {
      // Connect to authentic firebase stream
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          try {
            // Check if profile exists in users collection
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const uData = userSnap.data() as UserProfile;
              setProfile(uData);

              // 1. Check Tenant User Status for Suspensions
              let isActive = true;
              const tenantUserRef = doc(db, 'tenants', uData.tenantId, 'users', firebaseUser.uid);
              const tenantUserSnap = await getDoc(tenantUserRef);
              
              if (tenantUserSnap.exists()) {
                const tData = tenantUserSnap.data();
                if (tData.status === 'Inactive' || tData.status === 'Suspended') {
                  isActive = false;
                }
              }

              // 2. Get tenant config strictly
              const tenantRef = doc(db, 'tenants', uData.tenantId);
              const tenantSnap = await getDoc(tenantRef);
              
              if (tenantSnap.exists()) {
                setTenant(tenantSnap.data() as Tenant);
                // 3. Lockout or Allow ONLY if tenant exists
                setAuthStatus(isActive ? 'active' : 'suspended');
              } else {
                console.error("CRITICAL: User profile exists, but associated tenant is missing.");
                setAuthStatus('unauthenticated');
              }
              
            } else {
              // 1. Check if an invite exists for this email
              const inviteQuery = query(
                collection(db, 'invites'),
                where('email', '==', firebaseUser.email),
                where('status', '==', 'pending'),
                limit(1)
              );
              const inviteSnap = await getDocs(inviteQuery);

              if (!inviteSnap.empty) {
                // 2a. INVITE PATH: Profile pre-created by admin, just activate it
                const inviteDoc = inviteSnap.docs[0];
                const inviteData = inviteDoc.data();
                
                const userProfile: UserProfile = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  name: inviteData.name || firebaseUser.displayName || 'Operator',
                  tenantId: inviteData.tenantId,
                  role: inviteData.role,
                  createdAt: new Date().toISOString()
                };

                // Create the global user doc
                await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
                
                // Create the tenant-specific user doc
                await setDoc(doc(db, 'tenants', inviteData.tenantId, 'users', firebaseUser.uid), {
                  name: userProfile.name,
                  email: userProfile.email,
                  role: userProfile.role,
                  status: 'Active',
                  invitedAt: inviteData.createdAt,
                  createdAt: serverTimestamp()
                });

                // Mark invite as accepted
                await updateDoc(inviteDoc.ref, { 
                  status: 'accepted', 
                  acceptedAt: serverTimestamp(),
                  acceptedByUid: firebaseUser.uid
                });

                setProfile(userProfile);
                
                // Get tenant config strictly
                const tenantRef = doc(db, 'tenants', inviteData.tenantId);
                const tenantSnap = await getDoc(tenantRef);
                if (tenantSnap.exists()) {
                  setTenant(tenantSnap.data() as Tenant);
                  setAuthStatus('active');
                } else {
                  console.error("CRITICAL: Accepted invite points to a missing tenant.");
                  setAuthStatus('unauthenticated');
                }
                
              } else {
                // 2b. OWNER BOOTSTRAP PATH: No profile, no invite → create empty tenant and show onboarding
                const newTenantId = `tnt_${Date.now()}_${firebaseUser.uid.substring(0, 6)}`;
                
                const userProfile: UserProfile = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  name: firebaseUser.displayName || 'Workspace Owner',
                  tenantId: newTenantId,
                  role: 'admin', 
                  createdAt: new Date().toISOString()
                };

                const newTenant: Tenant = {
                  id: newTenantId,
                  companyName: '', 
                  gstin: '',
                  address: '',
                  currency: 'INR (₹)',
                  createdAt: new Date().toISOString()
                };

                try {
                  const batch = writeBatch(db);

                  batch.set(doc(db, 'users', firebaseUser.uid), userProfile);
                  
                  batch.set(doc(db, 'tenants', newTenantId), {
                    id: newTenantId, 
                    companyName: 'New Company',
                    createdAt: serverTimestamp(),
                    onboardingCompleted: false
                  });

                  batch.set(doc(db, 'tenants', newTenantId, 'users', firebaseUser.uid), {
                    name: userProfile.name,
                    email: userProfile.email,
                    role: 'admin',
                    status: 'Active',
                    createdAt: serverTimestamp()
                  });

                  await batch.commit();

                  setProfile(userProfile);
                  setTenant(newTenant);
                  setAuthStatus('needs_onboarding');
                } catch (bootstrapErr) {
                  console.error('Failed to provision workspace shell:', bootstrapErr);
                  setAuthStatus('unauthenticated');
                }
              }
            }
          } catch (e: any) {
            console.error('Error in Auth profile retrieval: ', e);
            if (e.code === 'permission-denied') {
              console.warn("Permission denied while fetching user. Re-evaluating Firestore rules.");
            }
            setAuthStatus('unauthenticated');
          }
        } else {
          setUser(null);
          setProfile(null);
          setTenant(null);
          setAuthStatus('unauthenticated');
        }
      });

      return () => unsubscribe();
    }
  }, []);

  const signInWithGoogle = async () => {
    setAuthStatus('loading');
    localStorage.removeItem('flowops_sandbox_profile');
    localStorage.removeItem('flowops_sandbox_tenant');
    localStorage.removeItem('isSandboxMode');
    setIsSandboxMode(false);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error('Google Auth Failed: ', e);
      setAuthStatus('unauthenticated');
    }
  };

  const signOut = async () => {
    setAuthStatus('loading');
    localStorage.removeItem('flowops_sandbox_profile');
    localStorage.removeItem('flowops_sandbox_tenant');
    localStorage.removeItem('isSandboxMode');
    setIsSandboxMode(false);
    setUser(null);
    setProfile(null);
    setTenant(null);
    await firebaseSignOut(auth);
    setAuthStatus('unauthenticated');
  };

  const initializeSandbox = (companyName: string) => {
    setAuthStatus('loading');
    const mockTenantId = `tenant_demo_${Math.random().toString(36).substring(2, 7)}`;
    const mockTenant: Tenant = {
      id: mockTenantId,
      companyName: companyName || 'Bharat Gearworks Ltd.',
      gstin: '27AAACB1234F1Z1',
      address: 'Plot 42, GIDC Industrial Estate, Sector 3, Vadodara, Gujarat',
      currency: '₹',
      createdAt: new Date().toISOString()
    };

    const mockProfile: UserProfile = {
      uid: `user_demo_${Math.random().toString(36).substring(2, 7)}`,
      email: 'demo@bharatgears.co.in',
      name: 'Rajesh Patel',
      tenantId: mockTenantId,
      role: 'admin',
      phone: '+919876543210',
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('flowops_sandbox_profile', JSON.stringify(mockProfile));
    localStorage.setItem('flowops_sandbox_tenant', JSON.stringify(mockTenant));
    localStorage.setItem('isSandboxMode', 'true');
    
    setProfile(mockProfile);
    setTenant(mockTenant);
    setIsSandboxMode(true);
    setAuthStatus('active');
  };

  const switchToSandboxRole = (role: UserRole) => {
    if (!profile) return;
    
    // SECURITY FIX: Strictly prevent non-admins from switching roles
    if (profile.role !== 'admin') {
      console.warn('Action blocked: Only Owner/Admin roles can switch user profiles.');
      return;
    }

    const updated = { ...profile, role };
    setProfile(updated);
    if (isSandboxMode) {
      localStorage.setItem('flowops_sandbox_profile', JSON.stringify(updated));
    } else {
      console.warn('Action blocked: Role updates in production must be managed exclusively by an admin via the Roster interface.');
    }
  };

  const updateProfileLocally = (updates: Partial<UserProfile>) => {
    if (!profile) return;

    // SECURITY FIX: Prevent non-admins from escalating to Super Admin
    if (updates.isSuperAdmin !== undefined && profile.role !== 'admin') {
      console.warn('Action blocked: Only Owner/Admin roles can toggle Super Admin mode.');
      return;
    }

    const updated = { ...profile, ...updates };
    setProfile(updated);
    if (isSandboxMode) {
      localStorage.setItem('flowops_sandbox_profile', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      tenant,
      authStatus,
      isSandboxMode,
      signInWithGoogle, 
      signOut, 
      switchToSandboxRole, 
      initializeSandbox,
      updateProfileLocally,
      setAuthStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};