import React from 'react';
import { CheckCircle, XCircle, Mail, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Transaction, User, Masterclass } from '@/hooks/__types';
import { formatCurrency, formatDate } from '@/lib/utils';
// import { convertToIST } from '@/lib/utils'; // Removed as not used anymore

interface DashboardCardProps {
  type: 'completed' | 'pending';
  transactions: Transaction[];
  count: number;
  selectedWeek: string;
  weekRanges: Array<{
    start: Date;
    end: Date;
    value: string;
    label: string;
  }>;
  masterclass?: Masterclass[] | null;
  onGenerateEmail?: (transaction: Transaction, type: 'completion' | 'reminder') => string;
  communityMessage?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  type,
  transactions,
  count,
  selectedWeek,
  weekRanges,
  onGenerateEmail,
  communityMessage = ""
}) => {
  const isCompleted = type === 'completed';

  const config = {
    completed: {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
      title: 'Successful Transactions',
      description: 'Users who completed their payment and registration',
      badgeColor: 'bg-green-100 text-green-800',
      badgeText: 'Successful',
      emptyMessage: 'No successful transactions found',
      primaryButtonText: {
        full: 'Send Registration Details',
        short: 'Send Details'
      },
      secondaryButtonText: {
        full: 'Whatsapp community',
        short: 'WhatsApp'
      }
    },
    pending: {
      icon: XCircle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-100',
      title: 'Incomplete Transactions',
      description: "Users who started but didn't complete their payment",
      badgeColor: 'bg-red-100 text-red-800',
      badgeText: 'Payment Pending',
      emptyMessage: 'No incomplete transactions found',
      primaryButtonText: {
        full: 'Send Payment Reminder',
        short: 'Send Reminder'
      },
      secondaryButtonText: null
    }
  };

  const currentConfig = config[type];
  const IconComponent = currentConfig.icon;

  const getWeekLabel = () => {
    if (selectedWeek === 'all-weeks') return null;
    if (selectedWeek === 'current-week') return 'Current Week';
    return weekRanges.find(w => w.value === selectedWeek)?.label;
  };

  const weekLabel = getWeekLabel();

  const renderTransactionItem = (transaction: Transaction) => {
    const user = transaction.userId;
    if (!user) return null;

    return (
      <Card key={transaction._id} className="p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          {/* User Info Section */}
          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 ${currentConfig.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
              <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 ${currentConfig.iconColor}`} />
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base truncate">
                {user.firstName || user.name} {user.lastName}
              </h3>

              <div className="flex flex-col space-y-1 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </span>
                <span className="truncate">📱 {isCompleted ? '' : '+91'}{user.phone}</span>
              </div>

              <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs">
                <Badge variant="outline" className="text-xs">{transaction.orderId}</Badge>

                {isCompleted ? (
                  <Badge variant="secondary" className={`${currentConfig.badgeColor} text-xs`}>
                    {formatCurrency(transaction.amount ?? 0)}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className={`${currentConfig.badgeColor} text-xs`}>
                    {currentConfig.badgeText}
                  </Badge>
                )}

                <span className="text-muted-foreground sm:inline">
                  {formatDate(transaction.createdAt)}
                </span>

              </div>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            {/* Primary Action Button */}
            {onGenerateEmail && (
              <Button
                asChild
                className="w-full lg:w-auto text-xs sm:text-sm"
                size="sm"
                variant={isCompleted ? "default" : "outline"}
              >
                <a href={onGenerateEmail(transaction, isCompleted ? 'completion' : 'reminder')}>
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{currentConfig.primaryButtonText.full}</span>
                  <span className="sm:hidden">{currentConfig.primaryButtonText.short}</span>
                </a>
              </Button>
            )}

            {/* Secondary Action Button (WhatsApp for completed only) */}
            {isCompleted && currentConfig.secondaryButtonText && communityMessage && (
              <Button
                asChild
                className="w-full lg:w-auto text-xs sm:text-sm"
                size="sm"
                variant="outline"
              >
                <a href={`https://wa.me/+91${user.phone}?text=${communityMessage}`} target='_blank'>
                  <span className="hidden sm:inline">{currentConfig.secondaryButtonText.full}</span>
                  <span className="sm:hidden">{currentConfig.secondaryButtonText.short}</span>
                </a>
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 ${currentConfig.iconColor}`} />
          {currentConfig.title}
        </CardTitle>
        <CardDescription className="text-sm">
          {currentConfig.description}
          {weekLabel && (
            <Badge variant="outline" className="ml-2 text-xs">
              <CalendarDays className="h-3 w-3 mr-1" />
              {weekLabel}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="space-y-3 sm:space-y-4">
          {count > 0 ? (
            transactions.map(renderTransactionItem)
          ) : (
            <Alert>
              <IconComponent className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {currentConfig.emptyMessage} {selectedWeek !== 'all-weeks' && 'for selected week'}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
