import React, { useEffect, useState } from 'react';
import { useAccounts } from '@/contexts/AccountContext';
import { Journal } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import JournalForm from '@/components/journal/JournalForm';
import JournalCard from '@/components/journal/JournalCard';
import { useToast } from '@/components/ui/use-toast';

const JournalPage = () => {
  const { user } = useAuth();
  const { selectedAccount } = useAccounts();
  const { toast } = useToast();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [filteredJournals, setFilteredJournals] = useState<Journal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateAccountDialogOpen, setIsCreateAccountDialogOpen] = useState(false);

  useEffect(() => {
    fetchJournals();
  }, [user, selectedAccount]);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredJournals(
        journals.filter(
          (journal) =>
            journal.title.toLowerCase().includes(query) ||
            journal.content.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredJournals(journals);
    }
  }, [journals, searchQuery]);

  const fetchJournals = async () => {
    if (!user || !selectedAccount) {
      setJournals([]);
      setFilteredJournals([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', user.id)
        .eq('account_id', selectedAccount.id)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      setJournals(data || []);
      setFilteredJournals(data || []);
    } catch (error) {
      console.error('Error fetching journals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load journal entries',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddJournal = async (journalData: Partial<Journal>) => {
    if (!user || !selectedAccount) return;

    try {
      const { data, error } = await supabase
        .from('journals')
        .insert([
          {
            ...journalData,
            user_id: user.id,
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Journal entry added successfully',
      });

      setIsAddDialogOpen(false);
      await fetchJournals();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add journal entry',
        variant: 'destructive',
      });
    }
  };

  const handleEditJournal = (journal: Journal) => {
    setSelectedJournal(journal);
    setIsEditDialogOpen(true);
  };

  const handleUpdateJournal = async (journalData: Partial<Journal>) => {
    if (!user || !selectedAccount || !selectedJournal) return;

    try {
      const { data, error } = await supabase
        .from('journals')
        .update(journalData)
        .eq('id', selectedJournal.id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Journal entry updated successfully',
      });

      setIsEditDialogOpen(false);
      setSelectedJournal(null);
      await fetchJournals();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update journal entry',
        variant: 'destructive',
      });
    }
  };

  const confirmDeleteJournal = (journal: Journal) => {
    setSelectedJournal(journal);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteJournal = async () => {
    if (!user || !selectedAccount || !selectedJournal) return;

    try {
      const { error } = await supabase
        .from('journals')
        .delete()
        .eq('id', selectedJournal.id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Journal entry deleted successfully',
      });

      setIsDeleteDialogOpen(false);
      await fetchJournals();
      setSelectedJournal(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete journal entry',
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
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Trading Journal</h2>
        <Button onClick={handleOpenAddDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Entry
        </Button>
      </div>

      {selectedAccount ? (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search journal entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredJournals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJournals.map((journal) => (
                <JournalCard
                  key={journal.id}
                  journal={journal}
                  onEdit={() => handleEditJournal(journal)}
                  onDelete={() => confirmDeleteJournal(journal)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                No journal entries found. {journals.length > 0 ? 'Try changing your search.' : 'Add your first entry to get started.'}
              </p>
              {journals.length === 0 && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  Add Journal Entry
                </Button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-muted/30 p-8">
          <p className="text-muted-foreground mb-4 text-center">
            Please create an account to start adding journal entries
          </p>
          <Button onClick={() => setIsCreateAccountDialogOpen(true)}>
            Create Account
          </Button>
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Journal Entry</DialogTitle>
          </DialogHeader>
          <JournalForm 
            onSubmit={handleAddJournal} 
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateAccountDialogOpen} onOpenChange={setIsCreateAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create an Account</DialogTitle>
            <DialogDescription>
              You need to create a trading account to start adding journal entries.
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
            <DialogTitle>Edit Journal Entry</DialogTitle>
          </DialogHeader>
          {selectedJournal && (
            <JournalForm 
              initialData={selectedJournal}
              onSubmit={handleUpdateJournal} 
              buttonText="Update Entry"
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedJournal(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Journal Entry</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this journal entry? This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedJournal(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteJournal}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JournalPage;
