import React, { useState } from 'react';
import { useAccounts } from '@/contexts/AccountContext';
import { Account, AccountType } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const AccountSelector: React.FC = () => {
  const { 
    accounts, 
    selectedAccount, 
    setSelectedAccount, 
    createAccount,
    updateAccount,
    deleteAccount 
  } = useAccounts();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('Demo');
  const [balance, setBalance] = useState('');
  
  const resetForm = () => {
    setName('');
    setType('Demo');
    setBalance('');
  };
  
  const handleCreateAccount = async () => {
    await createAccount({
      name,
      type,
      balance: parseFloat(balance),
      initial_balance: parseFloat(balance),
    });
    resetForm();
    setIsCreateOpen(false);
  };
  
  const handleUpdateAccount = async () => {
    if (selectedAccount) {
      await updateAccount(selectedAccount.id, {
        name,
        type,
        balance: parseFloat(balance),
        initial_balance: parseFloat(balance),
      });
      resetForm();
      setIsEditOpen(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (selectedAccount) {
      await deleteAccount(selectedAccount.id);
      setIsDeleteOpen(false);
    }
  };
  
  const handleSelectAccount = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      setSelectedAccount(account);
    }
  };
  
  const openEditDialog = () => {
    if (selectedAccount) {
      setName(selectedAccount.name);
      setType(selectedAccount.type);
      setBalance(selectedAccount.balance.toString());
      setIsEditOpen(true);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Account</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="account-name">Account Name</Label>
                <Input
                  id="account-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Trading Account"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <RadioGroup value={type} onValueChange={(value) => setType(value as AccountType)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Demo" id="demo" />
                    <Label htmlFor="demo">Demo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Live" id="live" />
                    <Label htmlFor="live">Live</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Prop Firm" id="prop" />
                    <Label htmlFor="prop">Prop Firm</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Other" id="other" />
                    <Label htmlFor="other">Other</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-balance">Initial Balance</Label>
                <Input
                  id="account-balance"
                  type="number"
                  step="0.01"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="10000.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateAccount}>Create Account</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {accounts.length > 0 ? (
        <div className="space-y-2">
          <Select
            value={selectedAccount?.id}
            onValueChange={handleSelectAccount}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={openEditDialog}
              disabled={!selectedAccount}
            >
              Edit
            </Button>
            
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-account-name">Account Name</Label>
                    <Input
                      id="edit-account-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <RadioGroup value={type} onValueChange={(value) => setType(value as AccountType)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Demo" id="edit-demo" />
                        <Label htmlFor="edit-demo">Demo</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Live" id="edit-live" />
                        <Label htmlFor="edit-live">Live</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Prop Firm" id="edit-prop" />
                        <Label htmlFor="edit-prop">Prop Firm</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Other" id="edit-other" />
                        <Label htmlFor="edit-other">Other</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-account-balance">Balance</Label>
                    <Input
                      id="edit-account-balance"
                      type="number"
                      step="0.01"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpdateAccount}>Update Account</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="destructive" 
              size="sm"
              className="flex-1"
              onClick={() => setIsDeleteOpen(true)}
              disabled={!selectedAccount}
            >
              Delete
            </Button>
            
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Account</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p>Are you sure you want to delete this account? This action cannot be undone, and all associated trades and journal entries will be permanently deleted.</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDeleteAccount}>Delete Account</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Create an account to get started</p>
      )}
    </div>
  );
};

export default AccountSelector;
