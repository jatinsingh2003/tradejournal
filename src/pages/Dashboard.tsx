import React, { useEffect, useState } from 'react';
import { useAccounts } from '@/contexts/AccountContext';
import { Trade } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatCurrency, calculateDashboardStats } from '@/lib/utils';
import { CalendarDays, TrendingUp, TrendingDown, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const { selectedAccount } = useAccounts();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyPerformance, setMonthlyPerformance] = useState<any[]>([]);
  const [dailyPerformance, setDailyPerformance] = useState<any[]>([]);

  useEffect(() => {
    const fetchTrades = async () => {
      if (!user || !selectedAccount) {
        setTrades([]);
        setIsLoading(false);
        return;
      }

      try {
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
        prepareChartData(data || []);
      } catch (error) {
        console.error('Error fetching trades:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();
  }, [user, selectedAccount]);

  const prepareChartData = (tradesData: Trade[]) => {
    // Prepare monthly performance data
    const monthlyData: { [key: string]: number } = {};
    
    tradesData.forEach(trade => {
      const monthKey = format(parseISO(trade.exit_date), 'MMM yyyy');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += trade.profit_loss;
    });
    
    const sortedMonthlyData = Object.entries(monthlyData)
      .map(([month, pnl]) => ({ month, pnl }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
    
    setMonthlyPerformance(sortedMonthlyData);

    // Prepare daily performance for current month
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const dailyData = daysInMonth.map(day => {
      const dayTrades = tradesData.filter(trade => 
        isSameDay(parseISO(trade.exit_date), day)
      );
      
      const totalPnl = dayTrades.reduce((sum, trade) => sum + trade.profit_loss, 0);
      
      return {
        day: format(day, 'd'),
        pnl: totalPnl,
        trades: dayTrades.length,
      };
    });
    
    setDailyPerformance(dailyData);
  };

  const stats = calculateDashboardStats(trades);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!selectedAccount) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-16rem)]">
        <h2 className="text-2xl font-bold mb-4">Welcome to Your Trading Journal</h2>
        <p className="text-muted-foreground mb-6">
          Please create an account to get started tracking your trades
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CalendarDays className="h-4 w-4 mr-2" />
              Total Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrades}</div>
            <p className="text-xs text-muted-foreground">
              Win Rate: {stats.winRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Net P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(stats.netProfitLoss)}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Profit: {formatCurrency(stats.totalProfit)}</span>
              <span>Loss: {formatCurrency(-stats.totalLoss)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <PieChart className="h-4 w-4 mr-2" />
              Best/Worst Trade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {stats.bestTrade ? (
                <div className="flex items-center text-green-500">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span className="font-semibold">
                    {formatCurrency(stats.bestTrade.profit_loss)}
                  </span>
                  <span className="text-xs ml-2 text-muted-foreground">
                    {stats.bestTrade.symbol}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No winning trades yet</div>
              )}
              
              {stats.worstTrade ? (
                <div className="flex items-center text-red-500">
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                  <span className="font-semibold">
                    {formatCurrency(stats.worstTrade.profit_loss)}
                  </span>
                  <span className="text-xs ml-2 text-muted-foreground">
                    {stats.worstTrade.symbol}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No losing trades yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingDown className="h-4 w-4 mr-2" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profit Factor:</span>
                <span className="font-medium">
                  {stats.profitFactor === 0 ? '0' : stats.profitFactor === Infinity ? '-' : stats.profitFactor.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg. R:R:</span>
                <span className="font-medium">{stats.averageRiskReward}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg. Win:</span>
                <span className="font-medium text-green-500">{formatCurrency(stats.averageProfit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg. Loss:</span>
                <span className="font-medium text-red-500">{formatCurrency(-stats.averageLoss)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {monthlyPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyPerformance}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="month" 
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`${formatCurrency(value as number)}`, 'P&L']}
                      labelStyle={{ color: '#000' }}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                    <Bar 
                      dataKey="pnl" 
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No trade data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Daily Performance (Current Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {dailyPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyPerformance}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="day" 
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'pnl' 
                          ? formatCurrency(value as number) 
                          : value,
                        name === 'pnl' ? 'P&L' : '# of Trades'
                      ]}
                      labelStyle={{ color: '#000' }}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pnl" 
                      name="pnl"
                      stroke="#3B82F6" 
                      activeDot={{ r: 6 }} 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No trade data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
