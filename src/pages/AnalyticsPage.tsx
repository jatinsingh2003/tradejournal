
import React, { useEffect, useState } from 'react';
import { useAccounts } from '@/contexts/AccountContext';
import { Trade } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { formatCurrency, calculateDashboardStats } from '@/lib/utils';
import { parseISO, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

const AnalyticsPage = () => {
  const { user } = useAuth();
  const { selectedAccount } = useAccounts();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [marketData, setMarketData] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<any[]>([]);
  const [dayOfWeekData, setDayOfWeekData] = useState<any[]>([]);
  const [equityCurveData, setEquityCurveData] = useState<any[]>([]);

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
          .order('exit_date', { ascending: true });

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
    // Monthly performance
    const monthlyPerformance: { [key: string]: { wins: number, losses: number, pnl: number } } = {};
    
    tradesData.forEach(trade => {
      const monthKey = format(parseISO(trade.exit_date), 'MMM yyyy');
      
      if (!monthlyPerformance[monthKey]) {
        monthlyPerformance[monthKey] = {
          wins: 0,
          losses: 0,
          pnl: 0
        };
      }
      
      if (trade.status === 'Win') {
        monthlyPerformance[monthKey].wins += 1;
      } else if (trade.status === 'Loss') {
        monthlyPerformance[monthKey].losses += 1;
      }
      
      monthlyPerformance[monthKey].pnl += trade.profit_loss;
    });
    
    const formattedMonthlyData = Object.entries(monthlyPerformance)
      .map(([month, data]) => ({
        month,
        wins: data.wins,
        losses: data.losses,
        pnl: data.pnl
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
      
    setMonthlyData(formattedMonthlyData);
    
    // Market distribution
    const marketDistribution: { [key: string]: number } = {};
    
    tradesData.forEach(trade => {
      const market = trade.market;
      if (!marketDistribution[market]) {
        marketDistribution[market] = 0;
      }
      marketDistribution[market] += 1;
    });
    
    const formattedMarketData = Object.entries(marketDistribution)
      .map(([name, value]) => ({
        name,
        value
      }));
      
    setMarketData(formattedMarketData);
    
    // Type distribution (Long/Short)
    const typeDistribution = {
      Long: { count: 0, pnl: 0 },
      Short: { count: 0, pnl: 0 }
    };
    
    tradesData.forEach(trade => {
      const type = trade.type;
      typeDistribution[type].count += 1;
      typeDistribution[type].pnl += trade.profit_loss;
    });
    
    const formattedTypeData = [
      { name: 'Long', count: typeDistribution.Long.count, pnl: typeDistribution.Long.pnl },
      { name: 'Short', count: typeDistribution.Short.count, pnl: typeDistribution.Short.pnl }
    ];
    
    setTypeData(formattedTypeData);
    
    // Day of week performance
    const dayOfWeekDistribution: { [key: string]: { count: number, pnl: number } } = {
      'Sunday': { count: 0, pnl: 0 },
      'Monday': { count: 0, pnl: 0 },
      'Tuesday': { count: 0, pnl: 0 },
      'Wednesday': { count: 0, pnl: 0 },
      'Thursday': { count: 0, pnl: 0 },
      'Friday': { count: 0, pnl: 0 },
      'Saturday': { count: 0, pnl: 0 }
    };
    
    tradesData.forEach(trade => {
      const dayOfWeek = format(parseISO(trade.exit_date), 'EEEE');
      dayOfWeekDistribution[dayOfWeek].count += 1;
      dayOfWeekDistribution[dayOfWeek].pnl += trade.profit_loss;
    });
    
    const formattedDayOfWeekData = Object.entries(dayOfWeekDistribution)
      .map(([day, data]) => ({
        day,
        count: data.count,
        pnl: data.pnl,
        avgPnl: data.count > 0 ? data.pnl / data.count : 0
      }));
      
    setDayOfWeekData(formattedDayOfWeekData);
    
    // Equity curve
    let cumulativePnl = selectedAccount?.initial_balance || 0;
    const equityCurve = tradesData.map(trade => {
      cumulativePnl += trade.profit_loss;
      return {
        date: format(parseISO(trade.exit_date), 'yyyy-MM-dd'),
        equity: cumulativePnl
      };
    });
    
    setEquityCurveData(equityCurve);
  };

  const stats = calculateDashboardStats(trades);
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A4DE6C', '#8884D8', '#82ca9d'];
  
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
        <h2 className="text-2xl font-bold mb-4">Trading Analytics</h2>
        <p className="text-muted-foreground mb-6">
          Please create an account to view your trading analytics
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.winRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {stats.totalTrades} total trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.profitFactor === 0 
                ? '0' 
                : stats.profitFactor === Infinity 
                  ? stats.totalProfit > 0 ? 'Infinite' : '0' 
                  : stats.profitFactor.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Gross profit / Gross loss
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Risk/Reward</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRiskReward}</div>
            <p className="text-xs text-muted-foreground">
              Average risk to reward ratio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Trade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              stats.netProfitLoss > 0 && stats.totalTrades > 0 
                ? 'text-green-500' 
                : stats.netProfitLoss < 0 && stats.totalTrades > 0 
                  ? 'text-red-500' 
                  : ''
            }`}>
              {stats.totalTrades > 0 
                ? formatCurrency(stats.netProfitLoss / stats.totalTrades) 
                : formatCurrency(0)}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Win: {formatCurrency(stats.averageProfit)}</span>
              <span>Loss: {formatCurrency(-stats.averageLoss)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Equity Curve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {equityCurveData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={equityCurveData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="date" 
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value as number), 'Equity']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="equity" 
                      stroke="#3B82F6" 
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No trades to display</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="month" 
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'pnl') return [formatCurrency(value as number), 'P&L'];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="right"
                      dataKey="wins" 
                      fill="#10B981" 
                      name="Wins"
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="losses" 
                      fill="#EF4444" 
                      name="Losses"
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="pnl" 
                      stroke="#3B82F6" 
                      name="P&L"
                      strokeWidth={2}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No trades to display</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Markets Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {marketData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={marketData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {marketData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} trades`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No market data to display</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Day of Week Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {dayOfWeekData.some(day => day.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dayOfWeekData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="day" />
                    <PolarRadiusAxis />
                    <Radar
                      name="Trade Count"
                      dataKey="count"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Tooltip formatter={(value, name) => {
                      if (name === 'Trade Count') return [value, name];
                      return [formatCurrency(value as number), name];
                    }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No day of week data to display</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
