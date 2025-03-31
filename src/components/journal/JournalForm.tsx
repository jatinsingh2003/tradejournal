
import React, { useState, useEffect } from 'react';
import { Journal } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAccounts } from '@/contexts/AccountContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarIcon } from 'lucide-react';
import { parseISO } from 'date-fns';

interface JournalFormProps {
  onSubmit: (journal: Partial<Journal>) => Promise<void>;
  initialData?: Journal;
  buttonText?: string;
  onCancel?: () => void;
}

const JournalForm: React.FC<JournalFormProps> = ({
  onSubmit,
  initialData,
  buttonText = 'Add Journal Entry',
  onCancel,
}) => {
  const { selectedAccount } = useAccounts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Journal>>({
    title: '',
    content: '',
    date: new Date().toISOString(),
  });
  
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
      });
    }
  }, [initialData]);
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData({
        ...formData,
        date: date.toISOString(),
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccount) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updatedJournal = {
        ...formData,
        account_id: selectedAccount.id,
      };
      
      await onSubmit(updatedJournal);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Journal Entry Title"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <div className="relative">
          <DatePicker
            selected={formData.date ? parseISO(formData.date) : null}
            onChange={handleDateChange}
            dateFormat="yyyy-MM-dd"
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          />
          <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="content">Journal Content</Label>
        <Textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="Write your trading thoughts, lessons learned, market analysis, etc."
          rows={10}
          required
        />
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

export default JournalForm;
