
import React from 'react';
import { useAccounts } from '@/contexts/AccountContext';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

const Header: React.FC = () => {
  const { selectedAccount, resetBalance } = useAccounts();
  const [isOpen, setIsOpen] = useState(false);
  const [newBalance, setNewBalance] = useState('');

  const handleResetBalance = async () => {
    if (selectedAccount && newBalance) {
      await resetBalance(selectedAccount.id, parseFloat(newBalance));
      setIsOpen(false);
      setNewBalance('');
    }
  };

  return (
    <header className="h-16 border-b px-6 flex items-center justify-between">
      <h1 className="text-lg font-medium">
        {selectedAccount ? `${selectedAccount.name} (${selectedAccount.type})` : 'Select an account'}
      </h1>
      
      {selectedAccount && (
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end text-sm">
            <span className="text-muted-foreground">Current Balance</span>
            <span className="text-lg font-semibold">
              {formatCurrency(selectedAccount.balance)}
            </span>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Reset Balance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Account Balance</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="balance">New Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  placeholder="Enter new balance"
                  className="mt-2"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={handleResetBalance}>Reset Balance</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </header>
  );
};

export default Header;
