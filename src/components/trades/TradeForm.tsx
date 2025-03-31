import React, { useState, useEffect } from 'react';
import { Trade, TradeType, MarketType, TradeStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAccounts } from '@/contexts/AccountContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarIcon, UploadCloud } from 'lucide-react';
import { parseISO, format } from 'date-fns';

interface TradeFormProps {
  onSubmit: (trade: Partial<Trade>) => Promise<void>;
  initialData?: Trade;
  buttonText?: string;
  onCancel?: () => void;
}

const TradeForm: React.FC<TradeFormProps> = ({
  onSubmit,
  initialData,
  buttonText = 'Add Trade',
  onCancel,
}) => {
  const { selectedAccount } = useAccounts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [profitLossType, setProfitLossType] = useState<'profit' | 'loss'>(
    initialData?.profit_loss && initialData.profit_loss >= 0 ? 'profit' : 'loss'
  );
  
  const [formData, setFormData] = useState<Partial<Trade>>({
    market: 'Forex',
    symbol: '',
    type: 'Long',
    entry_price: undefined,
    exit_price: undefined,
    stop_loss: undefined,
    take_profit: undefined,
    size: undefined,
    risk_reward: undefined,
    profit_loss: undefined,
    status: 'Win',
    entry_date: new Date().toISOString(),
    exit_date: new Date().toISOString(),
    notes: '',
    image_url: '',
  });
  
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
      });
      
      if (initialData.profit_loss !== undefined) {
        setProfitLossType(initialData.profit_loss >= 0 ? 'profit' : 'loss');
      }
      
      if (initialData.image_url) {
        setImagePreview(initialData.image_url);
      }
    }
  }, [initialData]);
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: value ? parseFloat(value) : undefined,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleDateChange = (name: string, date: Date | null) => {
    if (date) {
      setFormData({
        ...formData,
        [name]: date.toISOString(),
      });
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };
  
  const uploadImage = async (): Promise<string | undefined> => {
    if (!imageFile) return undefined;
    
    const cloudName = 'duyek0xle';
    const uploadPreset = 'tradepaglu';
    
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('upload_preset', uploadPreset);
    
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      }
      return undefined;
    } catch (error) {
      console.error('Error uploading image:', error);
      return undefined;
    }
  };
  
  const handleProfitLossChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    let numericValue = rawValue ? Math.abs(parseFloat(rawValue)) : undefined;
    
    // Apply sign based on profit/loss selection
    if (numericValue !== undefined) {
      numericValue = profitLossType === 'loss' ? -numericValue : numericValue;
    }
    
    setFormData({
      ...formData,
      profit_loss: numericValue,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccount) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let imageUrl = formData.image_url;
      
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      const updatedTrade = {
        ...formData,
        account_id: selectedAccount.id,
        image_url: imageUrl,
      };
      
      await onSubmit(updatedTrade);
    } catch (error: any) {
      console.error("Error submitting trade:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="market">Market</Label>
          <Select
            value={formData.market}
            onValueChange={(value) => handleSelectChange('market', value)}
            required
          >
            <SelectTrigger id="market">
              <SelectValue placeholder="Select Market" />
            </SelectTrigger>
            <SelectContent>
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
          <Label htmlFor="symbol">Symbol</Label>
          <Input
            id="symbol"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            placeholder="EURUSD, AAPL, BTC/USD"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="type">Trade Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => handleSelectChange('type', value)}
            required
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Long">Long</SelectItem>
              <SelectItem value="Short">Short</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status">Outcome</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleSelectChange('status', value)}
            required
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select Outcome" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Win">Win</SelectItem>
              <SelectItem value="Loss">Loss</SelectItem>
              <SelectItem value="Breakeven">Breakeven</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="entry_price">Entry Price</Label>
          <Input
            id="entry_price"
            name="entry_price"
            type="number"
            step="0.00000001"
            value={formData.entry_price === undefined ? '' : formData.entry_price}
            onChange={handleChange}
            placeholder="0.00"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="exit_price">Exit Price</Label>
          <Input
            id="exit_price"
            name="exit_price"
            type="number"
            step="0.00000001"
            value={formData.exit_price === undefined ? '' : formData.exit_price}
            onChange={handleChange}
            placeholder="0.00"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="stop_loss">Stop Loss (Optional)</Label>
          <Input
            id="stop_loss"
            name="stop_loss"
            type="number"
            step="0.00000001"
            value={formData.stop_loss === undefined ? '' : formData.stop_loss}
            onChange={handleChange}
            placeholder="0.00"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="take_profit">Take Profit (Optional)</Label>
          <Input
            id="take_profit"
            name="take_profit"
            type="number"
            step="0.00000001"
            value={formData.take_profit === undefined ? '' : formData.take_profit}
            onChange={handleChange}
            placeholder="0.00"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="size">Position Size</Label>
          <Input
            id="size"
            name="size"
            type="number"
            step="0.01"
            value={formData.size === undefined ? '' : formData.size}
            onChange={handleChange}
            placeholder="0.00"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="risk_reward">Risk/Reward Ratio (Optional)</Label>
          <Input
            id="risk_reward"
            name="risk_reward"
            placeholder="1:2"
            value={formData.risk_reward || ''}
            onChange={handleChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="profit_loss_type">Profit/Loss Type</Label>
          <Select
            value={profitLossType}
            onValueChange={(value) => {
              setProfitLossType(value as 'profit' | 'loss');
              // Update the profit_loss value with the correct sign
              if (formData.profit_loss !== undefined) {
                const absValue = Math.abs(formData.profit_loss);
                setFormData({
                  ...formData,
                  profit_loss: value === 'loss' ? -absValue : absValue
                });
              }
            }}
            required
          >
            <SelectTrigger id="profit_loss_type">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profit">Profit</SelectItem>
              <SelectItem value="loss">Loss</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="profit_loss">Amount</Label>
          <Input
            id="profit_loss"
            name="profit_loss"
            type="number"
            step="0.01"
            value={formData.profit_loss === undefined ? '' : Math.abs(formData.profit_loss || 0)}
            onChange={handleProfitLossChange}
            placeholder="0.00"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="entry_date">Entry Date & Time</Label>
          <div className="relative">
            <DatePicker
              selected={formData.entry_date ? parseISO(formData.entry_date) : null}
              onChange={(date: Date | null) => handleDateChange('entry_date', date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="yyyy-MM-dd HH:mm"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            />
            <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="exit_date">Exit Date & Time</Label>
          <div className="relative">
            <DatePicker
              selected={formData.exit_date ? parseISO(formData.exit_date) : null}
              onChange={(date: Date | null) => handleDateChange('exit_date', date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="yyyy-MM-dd HH:mm"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            />
            <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Trade Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          placeholder="Enter your trade rationale, what went right/wrong, emotions, etc."
          rows={4}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="image">Trade Screenshot (Optional)</Label>
        <div className="flex items-center gap-4">
          <Label
            htmlFor="image"
            className="cursor-pointer flex items-center gap-2 p-2 border border-dashed rounded-md hover:bg-muted"
          >
            <UploadCloud className="h-5 w-5" />
            <span>Upload Image</span>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </Label>
          {imagePreview && (
            <div className="w-40 h-auto relative">
              <img
                src={imagePreview}
                alt="Trade screenshot preview"
                className="w-full h-auto rounded-md"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                  if (initialData?.image_url) {
                    setFormData({
                      ...formData,
                      image_url: '',
                    });
                  }
                }}
              >
                ×
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              <span>Saving...</span>
            </div>
          ) : (
            buttonText
          )}
        </Button>
      </div>
    </form>
  );
};

export default TradeForm;
