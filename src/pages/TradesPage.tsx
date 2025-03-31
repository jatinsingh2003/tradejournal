import React, { useEffect, useState } from 'react';
import { useAccounts } from '@/contexts/AccountContext';
import { MarketType, Trade, TradeStatus, TradeType } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, FileDown, Download, Search, Filter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import TradeForm from '@/components/trades/TradeForm';
import TradeCard from '@/components/trades/TradeCard';
import { useToast } from '@/components/ui/use-toast';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import DatePicker from 'react-datepicker';

const TradesPage = () => {
  const { user } = useAuth();
  const { selectedAccount } = useAccounts();
  const { toast } = useToast();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateAccountDialogOpen, setIsCreateAccountDialogOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMarket, setFilterMarket] = useState<MarketType | 'All'>('All');
  const [filterType, setFilterType] = useState<TradeType | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<TradeStatus | 'All'>('All');
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchTrades();
  }, [user, selectedAccount]);

  useEffect(() => {
    applyFilters();
  }, [trades, searchQuery, filterMarket, filterType, filterStatus, filterStartDate, filterEndDate]);

  const fetchTrades = async () => {
    if (!user || !selectedAccount) {
      setTrades([]);
      setFilteredTrades([]);
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
      setFilteredTrades(data || []);
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

  const applyFilters = () => {
    let result = [...trades];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(trade => 
        trade.symbol.toLowerCase().includes(query) ||
        trade.notes?.toLowerCase().includes(query)
      );
    }
    
    if (filterMarket !== 'All') {
      result = result.filter(trade => trade.market === filterMarket);
    }
    
    if (filterType !== 'All') {
      result = result.filter(trade => trade.type === filterType);
    }
    
    if (filterStatus !== 'All') {
      result = result.filter(trade => trade.status === filterStatus);
    }
    
    if (filterStartDate) {
      result = result.filter(trade => 
        new Date(trade.exit_date) >= filterStartDate
      );
    }
    
    if (filterEndDate) {
      const endDateWithTime = new Date(filterEndDate);
      endDateWithTime.setHours(23, 59, 59, 999);
      result = result.filter(trade => 
        new Date(trade.exit_date) <= endDateWithTime
      );
    }
    
    setFilteredTrades(result);
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

  const confirmDeleteTrade = (trade: Trade) => {
    setSelectedTrade(trade);
    setIsDeleteDialogOpen(true);
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

  const resetFilters = () => {
    setSearchQuery('');
    setFilterMarket('All');
    setFilterType('All');
    setFilterStatus('All');
    setFilterStartDate(null);
    setFilterEndDate(null);
  };

  const exportToCSV = () => {
    const csvData = filteredTrades.map(trade => ({
      Symbol: trade.symbol,
      Market: trade.market,
      Type: trade.type,
      'Entry Price': trade.entry_price,
      'Exit Price': trade.exit_price,
      'Stop Loss': trade.stop_loss || '',
      'Take Profit': trade.take_profit || '',
      Size: trade.size,
      'Risk/Reward': trade.risk_reward || '',
      'Profit/Loss': trade.profit_loss,
      Status: trade.status,
      'Entry Date': formatDate(trade.entry_date),
      'Exit Date': formatDate(trade.exit_date),
      Notes: trade.notes || '',
    }));
    
    return csvData;
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Trading Journal - Trade Report', 14, 22);
    
    if (selectedAccount) {
      doc.setFontSize(12);
      doc.text(`Account: ${selectedAccount.name} (${selectedAccount.type})`, 14, 32);
    }
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38);
    
    const tableColumn = [
      "Symbol", 
      "Market", 
      "Type", 
      "Entry", 
      "Exit", 
      "P/L", 
      "Status", 
      "Date"
    ];
    
    const tableRows = filteredTrades.map(trade => [
      trade.symbol,
      trade.market,
      trade.type,
      trade.entry_price,
      trade.exit_price,
      trade.profit_loss.toFixed(2),
      trade.status,
      formatDate(trade.exit_date),
    ]);
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      styles: { 
        fontSize: 8,
        minCellHeight: 10
      },
      headStyles: { fillColor: [51, 51, 51] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    doc.save('trade-report.pdf');
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
        <h2 className="text-3xl font-bold">All Trades</h2>
        <div className="flex gap-2">
          {selectedAccount && (
            <>
              <Button variant="outline" onClick={exportToPDF}>
                <FileDown className="mr-2 h-4 w-4" /> PDF
              </Button>
              
              <CSVLink 
                data={exportToCSV()} 
                filename="trade-report.csv"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                <Download className="mr-2 h-4 w-4" /> CSV
              </CSVLink>
            </>
          )}
          
          <Button onClick={handleOpenAddDialog}>
            <Plus className="mr-2 h-4 w-4" /> Add Trade
          </Button>
        </div>
      </div>

      {selectedAccount ? (
        <>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h3 className="font-medium">Filter Trades</h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Market</label>
                    <Select 
                      value={filterMarket} 
                      onValueChange={(value) => setFilterMarket(value as (MarketType | 'All'))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Market" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Markets</SelectItem>
                        <SelectItem value="Forex">Forex</SelectItem>
                        <SelectItem value="Stocks">Stocks</SelectItem>
                        <SelectItem value="Crypto">Crypto</SelectItem>
                        <SelectItem value="Futures">Futures</SelectItem>
                        <SelectItem value="Options">Options</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <Select 
                      value={filterType} 
                      onValueChange={(value) => setFilterType(value as (TradeType | 'All'))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Types</SelectItem>
                        <SelectItem value="Long">Long</SelectItem>
                        <SelectItem value="Short">Short</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Outcome</label>
                    <Select 
                      value={filterStatus} 
                      onValueChange={(value) => setFilterStatus(value as (TradeStatus | 'All'))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Outcomes</SelectItem>
                        <SelectItem value="Win">Win</SelectItem>
                        <SelectItem value="Loss">Loss</SelectItem>
                        <SelectItem value="Breakeven">Breakeven</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date Range</label>
                    <div className="flex gap-2">
                      <div className="w-1/2">
                        <DatePicker
                          selected={filterStartDate}
                          onChange={setFilterStartDate}
                          selectsStart
                          startDate={filterStartDate}
                          endDate={filterEndDate}
                          placeholderText="Start Date"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="w-1/2">
                        <DatePicker
                          selected={filterEndDate}
                          onChange={setFilterEndDate}
                          selectsEnd
                          startDate={filterStartDate}
                          endDate={filterEndDate}
                          minDate={filterStartDate}
                          placeholderText="End Date"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-2">
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                      Reset
                    </Button>
                    <Button size="sm" onClick={() => setIsFilterOpen(false)}>
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {filteredTrades.length > 0 ? (
            <div className="space-y-4">
              {filteredTrades.map((trade) => (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  onEdit={() => handleEditTrade(trade)}
                  onDelete={() => confirmDeleteTrade(trade)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                No trades found. {trades.length > 0 ? 'Try adjusting your filters.' : 'Add your first trade to get started.'}
              </p>
              {trades.length === 0 && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  Add Trade
                </Button>
              )}
            </div>
          )}
        </>
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

export default TradesPage;
