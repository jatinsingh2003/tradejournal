
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Account } from '@/types';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface AccountContextProps {
  accounts: Account[];
  loading: boolean;
  selectedAccount: Account | null;
  fetchAccounts: () => Promise<void>;
  createAccount: (account: Omit<Account, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  setSelectedAccount: (account: Account) => void;
  resetBalance: (id: string, newBalance: number) => Promise<void>;
}

const AccountContext = createContext<AccountContextProps | undefined>(undefined);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAccounts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setAccounts(data);
        
        // Look for saved account ID in localStorage
        const savedAccountId = localStorage.getItem('selectedAccountId');
        
        if (savedAccountId) {
          // Find the saved account in the fetched accounts
          const savedAccount = data.find(acc => acc.id === savedAccountId);
          if (savedAccount) {
            setSelectedAccount(savedAccount);
          } else if (data.length > 0) {
            // If saved account not found but accounts exist, select the first one
            setSelectedAccount(data[0]);
            localStorage.setItem('selectedAccountId', data[0].id);
          }
        } else if (data.length > 0 && !selectedAccount) {
          // If no saved account and accounts exist, select the first one
          setSelectedAccount(data[0]);
          localStorage.setItem('selectedAccountId', data[0].id);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch accounts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (account: Omit<Account, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounts')
        .insert([{ ...account, user_id: user.id }])
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        toast({
          title: 'Success',
          description: 'Account created successfully',
        });
        
        await fetchAccounts();
        
        // Set as selected account
        setSelectedAccount(data[0]);
        localStorage.setItem('selectedAccountId', data[0].id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        toast({
          title: 'Success',
          description: 'Account updated successfully',
        });
        
        // Update accounts and selected account if it's the one being updated
        await fetchAccounts();
        if (selectedAccount && selectedAccount.id === id) {
          setSelectedAccount(data[0]);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update account',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetBalance = async (id: string, newBalance: number) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounts')
        .update({ 
          balance: newBalance,
          initial_balance: newBalance
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        toast({
          title: 'Success',
          description: 'Account balance reset successfully',
        });
        
        // Update accounts and selected account if it's the one being updated
        await fetchAccounts();
        if (selectedAccount && selectedAccount.id === id) {
          setSelectedAccount(data[0]);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset balance',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (id: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Account deleted successfully',
      });
      
      // Update accounts list and select another account if the deleted one was selected
      if (selectedAccount && selectedAccount.id === id) {
        localStorage.removeItem('selectedAccountId');
      }
      
      await fetchAccounts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle setting selected account
  const handleSetSelectedAccount = (account: Account) => {
    setSelectedAccount(account);
    localStorage.setItem('selectedAccountId', account.id);
  };

  useEffect(() => {
    if (user) {
      fetchAccounts();
    } else {
      setAccounts([]);
      setSelectedAccount(null);
      localStorage.removeItem('selectedAccountId');
    }
  }, [user]);

  return (
    <AccountContext.Provider 
      value={{ 
        accounts,
        loading,
        selectedAccount, 
        fetchAccounts,
        createAccount,
        updateAccount,
        deleteAccount,
        setSelectedAccount: handleSetSelectedAccount,
        resetBalance
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccounts() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccounts must be used within an AccountProvider');
  }
  return context;
}
