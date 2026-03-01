import { useState, useEffect, useMemo } from 'react';
import { Users, CheckCircle, XCircle, Calendar, Clock, MapPin, DollarSign, RefreshCw, Download, CalendarDays, Link, CircleAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { logout } from '@/_authContext/slice';
import type { Transaction } from '@/hooks/__types';
import { DesktopSidebar, MobileSidebar, SidebarProvider, useSidebar } from '../AdminSidebar';
import type { Masterclass } from '@/hooks/__types';
import { formatDate, formatCurrency, convertToIST, convertUTCToIST2 } from '@/lib/utils';
import DashboardCard from './DashBoardCard';
import { Alert, AlertDescription } from '../ui/alert';
import { generateCompletionEmailBootcamp } from './temp';

interface DashboardProps {
  // Redux props
  admin?: {
    name?: string;
    email?: string;
    isAdmin?: boolean;
  };
  loader?: boolean;

  // Functions
  dispatch?: any;
  navigate?: (path: string) => void;
}

type DashboardData = {
  count: number;
  success: boolean;
  totalFailed: number;
  totalSuccess: number;
  transactionfailed: Transaction[];
  transactionsuccess?: Transaction[];
  unproccessedTransaction?: any[]; // Keep as any for now as it's from Order table mostly
  unproccessedTransactionCount?: number;
  allTransaction: Transaction[];
  allTransactionCount: number;
};

const DashboardContent: React.FC<DashboardProps> = ({ admin, loader, dispatch, navigate }) => {
  const { collapsed } = useSidebar();

  const handleLogout = () => {
    localStorage.removeItem('authjs.csrf-token');
    dispatch(logout());
    navigate?.('/');
  };

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [masterclass, setMasterclass] = useState<Masterclass[] | null>(null);
  const [selectedWeek, setSelectedWeek] = useState('current-week'); // Default to current week

  // Utility function to get Sunday of a given date (start of week)
  const getSunday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday is 0, so this gets the start of week
    d.setDate(diff);
    d.setHours(17, 0, 0, 0); // Start of day
    return d;
  };

  // Utility function to get Saturday of a given date (end of week)
  const getSaturday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + 7; // Saturday is 6 days after Sunday
    d.setDate(diff);
    d.setHours(16, 59, 59, 999); // End of day
    return d;
  };

  // Function to get current week range (this Sunday to next Saturday)
  const getCurrentWeekRange = () => {
    const now = new Date();
    const sunday = getSunday(now);
    const saturday = getSaturday(now);

    return {
      start: sunday,
      end: saturday,
      value: 'current-week',
      label: `Current Week (${sunday.toLocaleDateString('en-GB')} - ${saturday.toLocaleDateString('en-GB')})`
    };
  };

  // Generate week ranges based on all transaction data
  const generateWeekRanges = () => {
    if (!data?.allTransaction?.length) return [getCurrentWeekRange()];

    const allTransactions = data.allTransaction;
    // console.log("allTransactions", allTransactions);

    // Get all transaction dates using createdAt from both transaction and user
    const dates = allTransactions.map(transaction => {
      // Use transaction createdAt first, fallback to user createdAt if needed (though transaction should always have createdAt)
      const dateToUse = transaction.createdAt || transaction.userId?.createdAt;
      return new Date(dateToUse ?? NaN);
    }).filter(date => date && !isNaN(date.getTime()));  // Filter out invalid dates

    if (!dates.length) return [getCurrentWeekRange()];

    const timestamps = dates.map(date => date.getTime());
    const minDate = new Date(Math.min(...timestamps));
    const maxDate = new Date(Math.max(...timestamps));

    const weeks = [];

    // Add current week first
    const currentWeek = getCurrentWeekRange();
    weeks.push(currentWeek);

    // Generate week ranges from earliest transaction to latest
    let currentSunday = getSunday(minDate);
    const endBoundary = getSunday(maxDate);

    while (currentSunday <= endBoundary) {
      const weekEnd = getSaturday(currentSunday);
      const weekStart = new Date(currentSunday);

      // Skip if this is the current week (already added)
      if (weekStart.getTime() !== currentWeek.start.getTime()) {
        weeks.push({
          start: weekStart,
          end: weekEnd,
          value: `${weekStart.getTime()}-${weekEnd.getTime()}`,
          label: `${weekStart.toLocaleDateString('en-GB')} - ${weekEnd.toLocaleDateString('en-GB')}`
        });
      }

      // Move to next week
      currentSunday.setDate(currentSunday.getDate() + 7);
    }

    // Sort weeks by start date (most recent first)
    return weeks.sort((a, b) => b.start.getTime() - a.start.getTime());
  };

  const weekRanges = useMemo(() => generateWeekRanges(), [data]);

  // Filter data by selected week - Updated to handle all weeks properly
  const getFilteredData = () => {
    if (!data) return data;

    // If "all-weeks" is selected, return the original data from backend
    if (selectedWeek === 'all-weeks') {
      return {
        ...data,
        // Use the original counts from backend for all weeks
        totalSuccess: data.totalSuccess,
        totalFailed: data.totalFailed,
        transactionsuccess: data.transactionsuccess || [],
        transactionfailed: data.transactionfailed || [],
        unProccessedCount: data.unproccessedTransactionCount || 0,
        unproccessedTransaction: data.unproccessedTransaction || [],

      };
    }

    let weekRange;

    if (selectedWeek === 'current-week') {
      weekRange = getCurrentWeekRange();
    } else {
      weekRange = weekRanges.find(week => week.value === selectedWeek);
    }

    if (!weekRange) return data;

    const filterTransactionsByWeek = (transactions: Transaction[]) => {
      return transactions.filter(transaction => {
        // Skip transactions with null/undefined userId
        if (!transaction.userId) return false;

        // Use paymentDetails timestamp for filtering, fallback to createdAt
        let transactionDate;

        if (transaction.createdAt) {
          transactionDate = new Date(transaction.createdAt);
        } else if (transaction.paymentDetails && transaction.paymentDetails.length > 0 && transaction.paymentDetails[0].timestamp) {
          // Fallback legacy support
          transactionDate = new Date(transaction.paymentDetails[0].timestamp);
        } else {
          transactionDate = new Date(); // Should not happen with new schema
        }

        // Check if date is valid
        if (isNaN(transactionDate.getTime())) return false;

        // Check if transaction date falls within the week range
        return transactionDate >= weekRange.start && transactionDate <= weekRange.end;
      });
    };
    const filterUsersByWeek = (users: any[]) => {
      return users.filter(user => {
        // Use createdAt for filtering (when user registered or order created)
        const userDate = new Date(user?.createdAt || new Date());

        // Check if date is valid
        if (isNaN(userDate.getTime())) return false;

        // Check if user date falls within the week range
        return userDate >= weekRange.start && userDate <= weekRange.end;
      });
    };

    const filteredSuccess = filterTransactionsByWeek(data.transactionsuccess || []);
    const filteredFailed = filterTransactionsByWeek(data.transactionfailed || []);
    const filteredUnprocessed = filterUsersByWeek(data.unproccessedTransaction || []);


    return {
      ...data,
      totalSuccess: filteredSuccess.length,
      totalFailed: filteredFailed.length,
      transactionsuccess: filteredSuccess,
      transactionfailed: filteredFailed,
      unproccessedTransactionCount: filteredUnprocessed.length,
      unproccessedTransaction: filteredUnprocessed || [],
    };
  };

  const filteredData = useMemo(() => getFilteredData(), [data, selectedWeek, weekRanges]);

  // CSV Export function
  const exportToCSV = (transactions: Transaction[], filename: string) => {
    const csvHeaders = [
      'First Name',
      'Last Name',
      'Phone',
      'Email',
      'City',
      'Order ID',
      'Transaction State',
      'Currency',
      'Amount',
      'Registration Date',
      'Payment Date',
      'Transaction ID'
    ];

    const csvData = transactions.map(transaction => [
      transaction.userId?.name?.split(' ')[0] || transaction.userId?.firstName || '',
      transaction.userId?.name?.split(' ').slice(1).join(' ') || transaction.userId?.lastName || '',
      transaction.userId?.phone || '',
      transaction.userId?.email || '',
      '', // City not in new schema
      transaction.orderId || '',
      transaction.status || transaction.state || '',
      transaction.currency || 'INR',
      transaction.amount || 0,
      formatDate(transaction.createdAt),
      transaction.createdAt ? formatDate(transaction.createdAt) : 'N/A',
      transaction.paymentId || (transaction.paymentDetails && transaction.paymentDetails[0]?.transactionId) || 'N/A'
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Export functions with proper week labeling
  const exportSuccessfulTransactions = () => {
    let weekLabel = 'All_Weeks';

    if (selectedWeek === 'current-week') {
      weekLabel = 'Current_Week';
    } else if (selectedWeek !== 'all-weeks') {
      const selectedRange = weekRanges.find(w => w.value === selectedWeek);
      weekLabel = selectedRange?.label.replace(/[^\w]/g, '_') || 'Selected_Week';
    }

    const filename = `successful_transactions_${weekLabel}_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(filteredData?.transactionsuccess || [], filename);
  };

  const exportIncompleteTransactions = () => {
    let weekLabel = 'All_Weeks';

    if (selectedWeek === 'current-week') {
      weekLabel = 'Current_Week';
    } else if (selectedWeek !== 'all-weeks') {
      const selectedRange = weekRanges.find(w => w.value === selectedWeek);
      weekLabel = selectedRange?.label.replace(/[^\w]/g, '_') || 'Selected_Week';
    }

    const filename = `incomplete_transactions_${weekLabel}_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(filteredData?.transactionfailed || [], filename);
  };

  const exportAllTransactions = () => {
    let weekLabel = 'All_Weeks';
    let transactionsToExport = [];

    if (selectedWeek === 'all-weeks') {
      // Use the complete allTransaction array from backend
      transactionsToExport = data?.allTransaction || [];
      weekLabel = 'All_Weeks';
    } else {
      // Use filtered data for specific weeks
      transactionsToExport = [
        ...(filteredData?.transactionsuccess || []),
        ...(filteredData?.transactionfailed || [])
      ];

      if (selectedWeek === 'current-week') {
        weekLabel = 'Current_Week';
      } else {
        const selectedRange = weekRanges.find(w => w.value === selectedWeek);
        weekLabel = selectedRange?.label.replace(/[^\w]/g, '_') || 'Selected_Week';
      }
    }

    const filename = `all_transactions_${weekLabel}_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(transactionsToExport, filename);
  };

  // API calls
  const fetchMasterclass = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/masterclass/all-classes`, { withCredentials: true });
      // console.log("masterclass response:", response.data);
      setMasterclass(response.data.courses || response.data.data || []);
    } catch (error) {
      console.error("Error fetching masterclass:", error);
    }
  };

  const getAllusers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/all-users-transaction`, { withCredentials: true });
      // console.log("All users response:", response.data?.unproccessedTransaction);
      // console.log(response.data);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllusers();
    fetchMasterclass();

    if (data && !loading) {
      if (loader) return;

      if (!admin?.isAdmin) {
        localStorage.removeItem('authjs.csrf-token');
        dispatch(logout());
      }
    }
  }, [admin, loader, dispatch, navigate]);

  // Email generation functions
  const generateCompletionEmail = (transaction: Transaction) => {
    const user = transaction.userId;
    // console.log("Generating email for user:", user);
    const subject = encodeURIComponent(`Registration Confirmed - ${masterclass?.[1]?.title || 'Masterclass'}`);

    const body = encodeURIComponent(`Dear ${user?.firstName} ${user?.lastName},

Congratulations! Your registration for "${masterclass?.[1]?.title || 'Masterclass'}" has been successfully confirmed.

MASTERCLASS DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Course: ${masterclass?.[1]?.title || 'N/A'}
👨‍🏫 Instructor: ${masterclass?.[1]?.instructor || 'N/A'}
📅 Date: ${masterclass?.[1]?.date ? formatDate(masterclass[1].date) : 'TBD'}
⏰ Time: ${masterclass?.[1]?.start_time || 'TBD'} - ${masterclass?.[1]?.end_time || 'TBD'}
📍 Location: ${masterclass?.[1]?.location || 'Online'}
💰 Amount Paid: ${formatCurrency(transaction.amount ?? 0)}
🆔 Order ID: ${transaction.orderId || 'N/A'}

NEXT STEPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. MEETING ACCESS: 
   Complete your registration using this link: ${masterclass?.[1]?.meeting_link || 'Will be shared soon'}

2. PREPARATION:
   • Ensure stable internet connection
   • Keep a notepad ready for key insights
   • Prepare any questions you'd like to ask

IMPORTANT REMINDERS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Please join 10 minutes before the scheduled time
• We recommend using a laptop/desktop for the best experience

CONTACT INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For any queries or technical support:
📧 Email: ${masterclass?.[1]?.email || 'support@cashflowcrew.in'}

We're excited to have you join us for this transformative learning experience!

Best regards,
The CashFlow Crew Team

---
This email was sent regarding your successful registration for our masterclass. If you have any concerns, please contact us immediately.

CashFlow Crew | Building Financial Success Together
Website: https://cashflowcrew.in`);

    return `https://mail.google.com/mail/u/4/?view=cm&to=${user?.email}&su=${subject}&body=${body}`;
  };

  const generateReminderEmail = (transaction: Transaction) => {
    const user = transaction.userId;
    const subject = encodeURIComponent(`Action Required: Complete Your Registration - ${masterclass?.[1]?.title || 'Masterclass'}`);

    const body = encodeURIComponent(`Dear ${user?.firstName} ${user?.lastName},

I hope this message finds you well. Our records indicate that you began the registration process for "${masterclass?.[1]?.title || 'Masterclass'}" but your payment remains incomplete.

REGISTRATION DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Masterclass: ${masterclass?.[1]?.title || 'N/A'}
👨‍🏫 Led by: ${masterclass?.[1]?.instructor || 'Expert Instructor'}
📅 Date: ${masterclass?.[1]?.date ? formatDate(masterclass[1].date) : 'To be confirmed'}
⏰ Time: ${masterclass?.[1]?.start_time || 'TBD'} - ${masterclass?.[1]?.end_time || 'TBD'}
💰 Investment: ₹${masterclass?.[1]?.price || 'N/A'} (Early Bird Pricing)
🆔 Your Order Reference: ${transaction.orderId || 'N/A'}

COMPREHENSIVE LEARNING EXPERIENCE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This masterclass has been designed to provide you with:

• Advanced Risk Assessment Methodologies used by institutional investors
• Systematic approaches to identify outperforming mutual fund schemes
• Strategic portfolio construction and diversification techniques
• Professional fund selection criteria and due diligence processes
• Wealth accumulation strategies through disciplined mutual fund investing

WHY SECURE YOUR SPOT TODAY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Limited enrollment to ensure personalized attention
✓ Interactive Q&A sessions
✓ Comprehensive resource materials and templates
✓ Post-session support and guidance
✓ Access to exclusive follow-up workshops

COMPLETE YOUR ENROLLMENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To finalize your registration and secure your learning opportunity:

👉 Visit: https://cashflowcrew.in/master-class/register
🔐 Use your Order ID: ${transaction.orderId || 'N/A'}

IMPORTANT NOTICE:
Due to overwhelming response, we have limited seats available. To guarantee your participation, please complete your payment within the next 48 hours.

NEED ASSISTANCE?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Our support team is available to assist you:
📧 Email: ${masterclass?.[1]?.email || 'support@cashflowcrew.in'}
📱 WhatsApp Support: Available during business hours

We understand that financial education is a significant step in your wealth-building journey. This masterclass represents our commitment to providing you with practical, actionable strategies that can make a meaningful difference in your investment approach.

We look forward to welcoming you to this transformative learning experience.

Warm regards,

The CashFlow Crew Team
Financial Education Specialists

---
PRIVACY NOTICE: Your information is secure and will not be shared with third parties. 
To opt out of future communications regarding this specific masterclass, reply with "REMOVE".

CashFlow Crew | Empowering Financial Success
Website: https://cashflowcrew.in | Email: support@cashflowcrew.in`);

    return `https://mail.google.com/mail/u/4/?view=cm&to=${user?.email}&su=${subject}&body=${body}`;
  };

  // console.log("filteredData?.transactionsuccess", filteredData?.transactionsuccess);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // console.log("lkllllllllllllll", (filteredData?.transactionsuccess ?? [])[0]?.userId?.name);


  const communityLink = "https://chat.whatsapp.com/DYwh29aoky4HRoVPcto3v3?mode=ems_copy_c";
  const message = encodeURIComponent(
    `Hey! Join our WhatsApp community here: ${communityLink}`
  );
  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar
        user={admin}
        onLogout={handleLogout}
        onNavigate={navigate}
      />

      <div className={`flex flex-1 flex-col transition-all duration-300 ease-in-out ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Mobile-optimized header */}
        <header className="sticky top-0 z-40 flex h-14 sm:h-16 items-center gap-3 sm:gap-4 border-b bg-white px-3 sm:px-4 md:px-6 shadow-sm">
          <MobileSidebar
            user={admin}
            onLogout={handleLogout}
            onNavigate={navigate}
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg md:text-2xl font-semibold text-gray-900 truncate">
              Dashboard
            </h1>
          </div>
        </header>

        <main className="flex-1 space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8">
          {/* Hero section with improved mobile layout */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col space-y-4">
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
                  Masterclass Dashboard
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {masterclass && masterclass.length > 0
                    ? (() => {
                      const recent = [...masterclass].sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
                      return recent ? recent.title : "No masterclasses found";
                    })()
                    : "Loading..."}
                </p>
              </div>

              {/* Mobile-friendly masterclass details */}
              {masterclass && masterclass.length > 0 && (() => {
                const recent = [...masterclass].sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];

                if (!recent) return null;

                return (
                  <div className="flex max-sm:flex-col gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">
                        {/* @ts-ignore */}
                        {recent.startDate ? formatDate(recent.startDate) : 'Date TBD'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">
                        {/* @ts-ignore */}
                        {recent.startDate ? new Date(recent.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Time TBD'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 sm:col-span-2 lg:col-span-1">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">
                        {/* @ts-ignore */}
                        {recent.type === 'LIVE' ? 'Online Live' : (recent.location || 'Online')}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Responsive stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <Card className="min-w-0 lg:h-[185px] -py-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
                  Completed Payments
                </CardTitle>
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-2xl font-bold">{filteredData?.totalSuccess || 0}</div>
                <Badge variant="secondary" className="mt-1 sm:mt-2 bg-green-100 text-green-800 text-xs">
                  Successful
                </Badge>
                {selectedWeek !== 'all-weeks' && (
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                    {selectedWeek === 'current-week' ? 'This week' : 'Selected week'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="min-w-0 lg:h-[185px] -py-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
                  Pending Payments
                </CardTitle>
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-2xl font-bold">{filteredData?.totalFailed || 0}</div>
                <Badge variant="secondary" className="mt-1 sm:mt-2 bg-red-100 text-red-800 text-xs">
                  Incomplete
                </Badge>
                {selectedWeek !== 'all-weeks' && (
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                    {selectedWeek === 'current-week' ? 'This week' : 'Selected week'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="min-w-0 lg:h-[185px] -py-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-base sm:text-2xl font-bold truncate">
                  {filteredData?.transactionsuccess?.reduce((sum, tx) => sum + (tx.amount ?? 0), 0)
                    ? formatCurrency(filteredData.transactionsuccess.reduce((sum, tx) => sum + (tx.amount ?? 0), 0))
                    : '₹0'}
                </div>
                <Badge variant="secondary" className="mt-1 sm:mt-2 bg-blue-100 text-blue-800 text-xs">
                  Collected
                </Badge>
                {selectedWeek !== 'all-weeks' && (
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                    {selectedWeek === 'current-week' ? 'This week' : 'Selected week'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="min-w-0 lg:h-[185px] -py-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
                  Total Registrations
                </CardTitle>
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-2xl font-bold">
                  {(filteredData?.totalSuccess || 0) + (filteredData?.totalFailed || 0)}
                </div>
                <Badge variant="secondary" className="mt-1 sm:mt-2 bg-purple-100 text-purple-800 text-xs">
                  {selectedWeek !== 'all-weeks' ? 'Filtered' : 'All Users'}
                </Badge>
                {selectedWeek !== 'all-weeks' && (
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                    {selectedWeek === 'current-week' ? 'This week' : 'Selected week'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mobile-optimized controls section */}
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-start">
            {/* Refresh button - mobile first */}
            <div className="order-2 sm:order-1">
              <Button onClick={getAllusers} disabled={loading} variant="outline" size="sm" className="w-full sm:w-auto">
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-sm">Refresh Data</span>
              </Button>
            </div>

            {/* Controls - mobile stacked */}
            <div className="order-1 sm:order-2 flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="week-select" className="text-sm font-medium">Filter by Week</Label>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="w-full sm:w-[280px] md:w-[300px] text-sm">
                    <SelectValue placeholder="Select week range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-weeks">All Weeks</SelectItem>
                    <SelectItem value="current-week">Current Week</SelectItem>
                    {weekRanges
                      .filter(week => week.value !== 'current-week')
                      .map((week, index) => (
                        <SelectItem key={index} value={week.value}>
                          {week.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Export Data</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={exportAllTransactions} size="sm" variant="outline" className="w-full sm:w-auto text-xs">
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    All CSV
                  </Button>
                  <Button onClick={exportSuccessfulTransactions} size="sm" variant="outline" className="w-full sm:w-auto text-xs">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Success
                  </Button>
                  <Button onClick={exportIncompleteTransactions} size="sm" variant="outline" className="w-full sm:w-auto text-xs">
                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Pending
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Responsive tabs */}
          <Tabs defaultValue="completed" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="completed" className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Successful Transactions</span>
                  <span className="sm:hidden">Successful</span>
                </span>
                <span className="text-xs">({filteredData?.totalSuccess || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4">
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Incomplete Transactions</span>
                  <span className="sm:hidden">Incomplete</span>
                </span>
                <span className="text-xs">({filteredData?.totalFailed || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="unproccessed" className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4">
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">UnProccessed Transactions</span>
                  <span className="sm:hidden">UnProcessed</span>
                </span>
                <span className="text-xs">({filteredData?.unproccessedTransactionCount || 0})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="completed">
              <DashboardCard
                type="completed"
                transactions={filteredData?.transactionsuccess || []}
                count={filteredData?.totalSuccess || 0}
                selectedWeek={selectedWeek}
                weekRanges={weekRanges}
                masterclass={masterclass}
                onGenerateEmail={(transaction, type) =>
                  type === 'completion'
                    ? ((transaction.amount ?? 0) < 100000
                      ? generateCompletionEmail(transaction)
                      : (masterclass && masterclass[1] && transaction.userId
                        ? generateCompletionEmailBootcamp(transaction.userId, [masterclass[0]])
                        : '#'))
                    : generateReminderEmail(transaction)
                }
                communityMessage={message}
              />
            </TabsContent>

            <TabsContent value="pending">
              <DashboardCard
                type="pending"
                transactions={filteredData?.transactionfailed || []}
                count={filteredData?.totalFailed || 0}
                selectedWeek={selectedWeek}
                weekRanges={weekRanges}
                masterclass={masterclass}
                onGenerateEmail={(transaction, type) =>
                  type === 'completion' ? generateCompletionEmail(transaction) : generateReminderEmail(transaction)
                }
                communityMessage={message}
              />
            </TabsContent>
            <TabsContent value="unproccessed">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CircleAlert className="h-5 w-5 text-orange-600" />
                    Unproccessed Transactions
                  </CardTitle>
                  <CardDescription>
                    Users who have pending payments but transaction found and failed transaction
                    {selectedWeek !== 'all-weeks' && (
                      <Badge variant="outline" className="ml-2">
                        <CalendarDays className="h-3 w-3 mr-1" />
                        {selectedWeek === 'current-week'
                          ? 'Current Week'
                          : weekRanges.find(w => w.value === selectedWeek)?.label}
                      </Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(filteredData?.unproccessedTransactionCount ?? 0) > 0 ? (
                      (filteredData?.unproccessedTransaction ?? []).map((tx: any) => {
                        // Extract user details with fallbacks
                        const user = tx.userId || tx.user;
                        const name = user?.firstName
                          ? `${user.firstName} ${user.lastName || ''}`
                          : (user?.name || tx.lead?.name || tx.guestName || 'Guest');

                        const email = user?.email || tx.lead?.email || tx.guestEmail || 'No email';
                        const phone = user?.phone || tx.lead?.phone || tx.guestPhone || 'No phone';

                        return (
                          <Card key={tx._id || tx.id} className="p-4">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                  <XCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="space-y-1 flex-1">
                                  <h3 className="font-semibold">
                                    {name}
                                  </h3>
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Link className="w-3 h-3" />
                                      {email}
                                    </span>
                                    <span>📱 +91{phone}</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <Badge variant="outline">{tx.orderId}</Badge>
                                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                                      Payment Pending
                                    </Badge>
                                    <span className="text-muted-foreground">
                                      {formatDate(tx.createdAt || '')}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {/* EventTime removed from schema */}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button variant="outline" asChild className="w-full lg:w-auto" size="sm">
                                <a href={`https://www.cashflowcrew.in/payment/status/${tx.orderId}`} target="_blank" rel="noopener noreferrer">
                                  <Link className="w-4 h-4 mr-2" />
                                  <span className="hidden sm:inline">Check Status</span>
                                  <span className="sm:hidden">Check Status</span>
                                </a>
                              </Button>
                            </div>
                          </Card>
                        )
                      })
                    ) : (
                      <Alert>
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          No incomplete transactions found {selectedWeek !== 'all-weeks' && 'for selected week'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

// Main Dashboard Component with Provider
const Dashboard: React.FC<DashboardProps> = (props) => {
  return (
    <SidebarProvider>
      <DashboardContent {...props} />
    </SidebarProvider>
  );
};

export default Dashboard;