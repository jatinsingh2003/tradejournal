
import React from 'react';
import { Journal } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { formatShortDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface JournalCardProps {
  journal: Journal;
  onEdit?: () => void;
  onDelete?: () => void;
}

const JournalCard: React.FC<JournalCardProps> = ({ journal, onEdit, onDelete }) => {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg">{journal.title}</h3>
          <p className="text-sm text-muted-foreground">
            {formatShortDate(journal.date)}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        <p className="text-sm whitespace-pre-line">
          {journal.content.length > 300
            ? `${journal.content.slice(0, 300)}...`
            : journal.content}
        </p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-end gap-2">
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
        )}
        {onDelete && (
          <Button variant="destructive" size="sm" onClick={onDelete}>
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default JournalCard;
