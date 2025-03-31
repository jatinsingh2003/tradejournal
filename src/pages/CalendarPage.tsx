import React, { useEffect, useState } from 'react';
import { useAccounts } from '@/contexts/AccountContext';
import { Trade } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import TradeCalendar from '@/components/calendar/TradeCalendar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import TradeForm from '@/components/trades/TradeForm';
import { useToast } from '@/components/ui/use-toast';

const CalendarPage = () => {
  const { user } = useAuth();
  const { selectedAccount } = useAccounts();
  const { toast } = useToast();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateAccountDialogOpen, setIsCreateAccountDialogOpen] = useState(false);

  useEffect(() => {
    fetchTrades();
  }, [user, selectedAccount]);

  const fetchTrades = async () => {
    if (!user || !selectedAccount) {
      setTrades([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('account_id', selectedAccount.id)
        .order('exit_date', { ascending: false });

      if (error) {
        throw error;
      }

      setTrades(data || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
      toast({
        title: 'Error',
        description: 'Failed to load trades',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTrade = async (tradeData: Partial<Trade>) => {
    if (!user || !selectedAccount) return;

    try {
      const { data, error } = await supabase
        .from('trades')
        .insert([
          {
            ...tradeData,
            user_id: user.id,
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Trade added successfully',
      });

      setIsAddDialogOpen(false);
      
      if (tradeData.profit_loss) {
        const { error: updateError } = await supabase
          .from('accounts')
          .update({ 
            balance: selectedAccount.balance + tradeData.profit_loss 
          })
          .eq('id', selectedAccount.id);
          
        if (updateError) {
          console.error('Error updating account balance:', updateError);
        }
      }
      
      await fetchTrades();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add trade',
        variant: 'destructive',
      });
    }
  };

  const handleEditTrade = (trade: Trade) => {
    setSelectedTrade(trade);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTrade = async (tradeData: Partial<Trade>) => {
    if (!user || !selectedAccount || !selectedTrade) return;

    try {
      const originalPL = selectedTrade.profit_loss;
      const newPL = tradeData.profit_loss || 0;
      const plDifference = newPL - originalPL;
      
      const { data, error } = await supabase
        .from('trades')
        .update(tradeData)
        .eq('id', selectedTrade.id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Trade updated successfully',
      });

      setIsEditDialogOpen(false);
      setSelectedTrade(null);
      
      if (plDifference !== 0) {
        const { error: updateError } = await supabase
          .from('accounts')
          .update({ 
            balance: selectedAccount.balance + plDifference 
          })
          .eq('id', selectedAccount.id);
          
        if (updateError) {
          console.error('Error updating account balance:', updateError);
        }
      }
      
      await fetchTrades();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update trade',
        variant: 'destructive',
      });
    }
  };

  const confirmDeleteTrade = (tradeId: string) => {
    const trade = trades.find(t => t.id === tradeId);
    if (trade) {
      setSelectedTrade(trade);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleDeleteTrade = async () => {
    if (!user || !selectedAccount || !selectedTrade) return;

    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', selectedTrade.id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Trade deleted successfully',
      });

      setIsDeleteDialogOpen(false);
      
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ 
          balance: selectedAccount.balance - selectedTrade.profit_loss 
        })
        .eq('id', selectedAccount.id);
        
      if (updateError) {
        console.error('Error updating account balance:', updateError);
      }
      
      await fetchTrades();
      setSelectedTrade(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete trade',
        variant: 'destructive',
      });
    }
  };

  const handleOpenAddDialog = () => {
    if (!selectedAccount) {
      setIsCreateAccountDialogOpen(true);
    } else {
      setIsAddDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Trading Calendar</h2>
        <Button onClick={handleOpenAddDialog} className="rounded-full">
          <Plus className="mr-2 h-4 w-4" /> Add Trade
        </Button>
      </div>

      {selectedAccount ? (
        <TradeCalendar 
          trades={trades}
          onEdit={handleEditTrade}
          onDelete={confirmDeleteTrade}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-muted/30 p-8">
          <p className="text-muted-foreground mb-4 text-center">
            Please create an account to start tracking your trades
          </p>
          <Button onClick={() => setIsCreateAccountDialogOpen(true)}>
            Create Account
          </Button>
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Trade</DialogTitle>
          </DialogHeader>
          <TradeForm 
            onSubmit={handleAddTrade} 
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateAccountDialogOpen} onOpenChange={setIsCreateAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create an Account</DialogTitle>
            <DialogDescription>
              You need to create a trading account to start adding trades.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              Please go to the account settings in the sidebar to create your first trading account.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsCreateAccountDialogOpen(false)}>
              Ok, I understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Trade</DialogTitle>
          </DialogHeader>
          {selectedTrade && (
            <TradeForm 
              initialData={selectedTrade}
              onSubmit={handleUpdateTrade} 
              buttonText="Update Trade"
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedTrade(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Trade</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this trade? This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedTrade(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTrade}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;
