
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from 'date-fns';
import { Trade } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy HH:mm');
}

export function formatShortDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy');
}

export function calculateDashboardStats(trades: Trade[]) {
  if (!trades.length) {
    return {
      totalTrades: 0,
      winRate: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfitLoss: 0,
      averageProfit: 0,
      averageLoss: 0,
      profitFactor: 0,
      bestTrade: null,
      worstTrade: null,
      averageRiskReward: '0:0',
    };
  }

  const totalTrades = trades.length;
  const winningTrades = trades.filter(trade => trade.status === 'Win');
  const losingTrades = trades.filter(trade => trade.status === 'Loss');
  
  const winRate = (winningTrades.length / totalTrades) * 100;
  
  const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.profit_loss, 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profit_loss, 0));
  
  const netProfitLoss = trades.reduce((sum, trade) => sum + trade.profit_loss, 0);
  
  const averageProfit = winningTrades.length 
    ? totalProfit / winningTrades.length 
    : 0;
    
  const averageLoss = losingTrades.length 
    ? totalLoss / losingTrades.length 
    : 0;
    
  const profitFactor = totalLoss === 0 
    ? (totalProfit > 0 ? totalProfit : 0) 
    : totalProfit / totalLoss;

  // Find best and worst trades
  let bestTrade = null;
  let worstTrade = null;
  
  if (trades.length === 1) {
    // If there's only one trade
    const trade = trades[0];
    if (trade.profit_loss > 0) {
      bestTrade = trade;
    } else if (trade.profit_loss < 0) {
      worstTrade = trade;
    }
  } else {
    // With multiple trades
    if (winningTrades.length > 0) {
      bestTrade = winningTrades.reduce((best, trade) => 
        trade.profit_loss > (best?.profit_loss || 0) ? trade : best, winningTrades[0]);
    }
    
    if (losingTrades.length > 0) {
      worstTrade = losingTrades.reduce((worst, trade) => 
        trade.profit_loss < (worst?.profit_loss || 0) ? trade : worst, losingTrades[0]);
    }
  }
  
  // Calculate average risk:reward ratio
  const tradesWithRR = trades.filter(trade => trade.risk_reward && trade.risk_reward.includes(':'));
  
  let averageRiskReward = '0:0';
  
  if (tradesWithRR.length > 0) {
    let totalRisk = 0;
    let totalReward = 0;
    
    tradesWithRR.forEach(trade => {
      if (trade.risk_reward) {
        const [risk, reward] = trade.risk_reward.split(':').map(Number);
        if (!isNaN(risk) && !isNaN(reward)) {
          totalRisk += risk;
          totalReward += reward;
        }
      }
    });
    
    const avgRisk = totalRisk / tradesWithRR.length;
    const avgReward = totalReward / tradesWithRR.length;
    
    averageRiskReward = `${avgRisk.toFixed(1)}:${avgReward.toFixed(1)}`;
  }

  return {
    totalTrades,
    winRate,
    totalProfit,
    totalLoss,
    netProfitLoss,
    averageProfit,
    averageLoss,
    profitFactor,
    bestTrade,
    worstTrade,
    averageRiskReward,
  };
}
