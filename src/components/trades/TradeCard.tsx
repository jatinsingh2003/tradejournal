
import React from 'react';
import { Trade } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TradeCardProps {
  trade: Trade;
  onEdit?: () => void;
  onDelete?: () => void;
}

const TradeCard: React.FC<TradeCardProps> = ({ trade, onEdit, onDelete }) => {
  const isWin = trade.status === 'Win';
  const isBreakeven = trade.status === 'Breakeven';
  const isLoss = trade.status === 'Loss';
  
  return (
    <Card className={`overflow-hidden bg-opacity-90 backdrop-blur-sm ${
      isWin 
        ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-l-4 border-l-green-500' 
        : isBreakeven 
          ? 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-l-4 border-l-yellow-500' 
          : 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-l-4 border-l-red-500'
    }`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xl tracking-tight">{trade.symbol}</h3>
              <Badge variant={trade.type === 'Long' ? 'default' : 'destructive'} className="ml-1">
                {trade.type}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{trade.market}</p>
          </div>
          
          <div className="flex flex-col items-end">
            <div className={`flex items-center font-semibold text-xl ${
              isWin 
                ? 'text-green-600 dark:text-green-400' 
                : isBreakeven 
                  ? 'text-amber-600 dark:text-amber-400' 
                  : 'text-red-600 dark:text-red-400'
            }`}>
              {isWin ? <TrendingUp className="h-4 w-4 mr-1" /> : isLoss ? <TrendingDown className="h-4 w-4 mr-1" /> : null}
              {formatCurrency(trade.profit_loss)}
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={
                isWin ? 'outline' : isBreakeven ? 'secondary' : 'destructive'
              } className="text-xs">
                {trade.status}
              </Badge>
              {trade.risk_reward && (
                <span className="text-xs text-muted-foreground">
                  R:R {trade.risk_reward}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div className="bg-card/60 dark:bg-card/20 rounded-lg p-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Entry</p>
                <p className="text-sm font-medium">{trade.entry_price}</p>
                <p className="text-xs text-muted-foreground">{formatDate(trade.entry_date)}</p>
              </div>
              
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Exit</p>
                <p className="text-sm font-medium">{trade.exit_price}</p>
                <p className="text-xs text-muted-foreground">{formatDate(trade.exit_date)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card/60 dark:bg-card/20 rounded-lg p-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Stop Loss</p>
                <p className="text-sm font-medium">{trade.stop_loss || "—"}</p>
              </div>
              
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Take Profit</p>
                <p className="text-sm font-medium">{trade.take_profit || "—"}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-3 bg-card/60 dark:bg-card/20 rounded-lg p-2">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Size</p>
          <p className="text-sm font-medium">{trade.size}</p>
        </div>
        
        {trade.notes && (
          <div className="mt-3 bg-card/60 dark:bg-card/20 rounded-lg p-2">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Notes</p>
            <p className="text-sm line-clamp-2">{trade.notes}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between items-center bg-card/60 dark:bg-card/20 p-3 border-t border-border/40">
        {trade.image_url ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                View Chart
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Trade Chart: {trade.symbol}</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <img 
                  src={trade.image_url} 
                  alt={`Trade chart for ${trade.symbol}`} 
                  className="w-full h-auto rounded-md"
                />
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <div />
        )}
        
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} className="text-xs">
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete} className="text-xs">
              Delete
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default TradeCard;
