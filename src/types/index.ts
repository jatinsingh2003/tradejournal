
export interface User {
  id: string;
  email: string;
  created_at?: string;
}

export type AccountType = 'Demo' | 'Live' | 'Prop Firm' | 'Other';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  initial_balance: number;
  created_at?: string;
}

export type TradeType = 'Long' | 'Short';
export type MarketType = 'Forex' | 'Stocks' | 'Crypto' | 'Futures' | 'Options' | 'Other';
export type TradeStatus = 'Win' | 'Loss' | 'Breakeven';

export interface Trade {
  id: string;
  user_id: string;
  account_id: string;
  market: MarketType;
  symbol: string;
  type: TradeType;
  entry_price: number;
  exit_price: number;
  stop_loss?: number;
  take_profit?: number;
  size: number;
  risk_reward?: string;
  profit_loss: number;
  status: TradeStatus;
  entry_date: string;
  exit_date: string;
  notes?: string;
  image_url?: string;
  created_at?: string;
}

export interface Journal {
  id: string;
  user_id: string;
  account_id: string;
  title: string;
  content: string;
  date: string;
  created_at?: string;
}

export interface DashboardStats {
  totalTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfitLoss: number;
  averageProfit: number;
  averageLoss: number;
  profitFactor: number;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
  averageRiskReward: string;
}

export interface CalendarDay {
  date: Date;
  trades: Trade[];
  totalProfitLoss: number;
  tradeCount: number;
  isCurrentMonth: boolean;
}
