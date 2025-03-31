
import React, { useState, useEffect } from 'react';
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, parseISO, isWithinInterval, isToday, getDay, startOfWeek, endOfWeek } from 'date-fns';
import { Trade, CalendarDay } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import TradeCard from '@/components/trades/TradeCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TradeCalendarProps {
  trades: Trade[];
  onEdit?: (trade: Trade) => void;
  onDelete?: (tradeId: string) => void;
}

const TradeCalendar: React.FC<TradeCalendarProps> = ({ trades, onEdit, onDelete }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [weekdays] = useState(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

  useEffect(() => {
    if (trades.length) {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      // Get all days in month plus padding days to fill the grid
      const calendarStart = startOfWeek(monthStart);
      const calendarEnd = endOfWeek(monthEnd);
      
      const daysInCalendar = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
      });
      
      const calendarData = daysInCalendar.map(date => {
        const dayTrades = trades.filter(trade => {
          const exitDate = parseISO(trade.exit_date);
          return isSameDay(exitDate, date);
        });
        
        const totalProfitLoss = dayTrades.reduce((sum, trade) => sum + trade.profit_loss, 0);
        
        return {
          date,
          trades: dayTrades,
          totalProfitLoss,
          tradeCount: dayTrades.length,
          isCurrentMonth: date.getMonth() === monthStart.getMonth(),
        };
      });
      
      setCalendarDays(calendarData);
    } else {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      // Get all days in month plus padding days to fill the grid
      const calendarStart = startOfWeek(monthStart);
      const calendarEnd = endOfWeek(monthEnd);
      
      const daysInCalendar = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
      });
      
      const emptyCalendarData = daysInCalendar.map(date => ({
        date,
        trades: [],
        totalProfitLoss: 0,
        tradeCount: 0,
        isCurrentMonth: date.getMonth() === monthStart.getMonth(),
      }));
      
      setCalendarDays(emptyCalendarData);
    }
  }, [trades, currentMonth]);

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleDayClick = (day: CalendarDay) => {
    if (day.tradeCount > 0) {
      setSelectedDay(day);
      setIsDialogOpen(true);
    }
  };

  const handleTradeEdit = (trade: Trade) => {
    setIsDialogOpen(false);
    if (onEdit) {
      onEdit(trade);
    }
  };

  const handleTradeDelete = (tradeId: string) => {
    setIsDialogOpen(false);
    if (onDelete) {
      onDelete(tradeId);
    }
  };

  return (
    <div className="w-full bg-card rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <CalendarIcon className="mr-2 h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" className="rounded-full" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-1">
        {weekdays.map((day) => (
          <div key={day} className="text-center font-medium text-sm text-muted-foreground p-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 auto-rows-fr">
        {calendarDays.map((day, index) => {
          const dayOfMonth = format(day.date, 'd');
          const isOtherMonth = !day.isCurrentMonth;
          const isTodayDate = isToday(day.date);
          
          // Base styles for all days
          let dayBaseClass = cn(
            "rounded-xl relative transition-all duration-200 min-h-[100px] p-1",
            isOtherMonth ? "opacity-40" : "",
            isTodayDate ? "ring-2 ring-primary ring-opacity-70" : ""
          );
          
          // Add profit/loss specific styling
          let dayClass = cn(
            dayBaseClass,
            day.tradeCount > 0 
              ? day.totalProfitLoss > 0
                ? "bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer" 
                : day.totalProfitLoss < 0
                  ? "bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer"
                  : "bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 cursor-pointer"
              : "bg-card/50 dark:bg-card/10 hover:bg-card/80 dark:hover:bg-card/20"
          );
          
          return (
            <div
              key={index}
              className={dayClass}
              onClick={() => handleDayClick(day)}
            >
              <div className={cn(
                "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full mb-1",
                isTodayDate ? "bg-primary text-primary-foreground" : "text-foreground"
              )}>
                {dayOfMonth}
              </div>
              
              {day.tradeCount > 0 && (
                <div className="mt-auto space-y-1">
                  <div className={cn(
                    "text-xs font-medium rounded-full px-2 py-0.5 w-fit",
                    day.totalProfitLoss > 0
                      ? "bg-green-200/80 dark:bg-green-800/50 text-green-800 dark:text-green-200"
                      : day.totalProfitLoss < 0
                        ? "bg-red-200/80 dark:bg-red-800/50 text-red-800 dark:text-red-200"
                        : "bg-amber-200/80 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200"
                  )}>
                    {day.tradeCount} {day.tradeCount === 1 ? 'trade' : 'trades'}
                  </div>
                  
                  <div className={cn(
                    "text-xs font-semibold",
                    day.totalProfitLoss > 0
                      ? "text-green-600 dark:text-green-400"
                      : day.totalProfitLoss < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-amber-600 dark:text-amber-400"
                  )}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      signDisplay: 'always',
                    }).format(day.totalProfitLoss)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedDay && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Trades on {format(selectedDay.date, 'MMMM d, yyyy')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedDay.trades.map((trade) => (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  onEdit={() => handleTradeEdit(trade)}
                  onDelete={() => handleTradeDelete(trade.id)}
                />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TradeCalendar;
