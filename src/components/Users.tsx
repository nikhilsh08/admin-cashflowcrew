import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Clock, RefreshCw, Download,
  CheckCircle, XCircle, DollarSign, Users, Phone,
  Mail, Search, User, TrendingUp, BarChart3,
  FileText, CreditCard,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, Area,
  Legend, ComposedChart,
} from 'recharts';

// Shadcn UI components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

// Types
interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string; // Added for simplified data
  email: string;
  phone: string;
  orderId?: string;
  transaction?: boolean;
  totalSessionAttended?: number;
  Currency?: string;
  Value?: number;
  EventTime?: string;
  createdAt?: string;
  isAdmin?: boolean;
  role?: string;
  transactionStatus?: string;
}

interface Transaction {
  _id: string;
  state: string;
  createdAt: string;
  userId: User;
  amount?: number;
  currency?: string;
}

interface Order {
  id: string;
  orderId: string | null;
  status: string;
  totalAmount: number;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  } | null;
  items: {
    course: {
      title: string;
    };
  }[];
  paymentTransaction: {
    status: string;
    paymentId: string;
  } | null;
}

interface DashboardStats {
  completedPayments: number;
  pendingPayments: number;
  totalRevenue: number;
  totalRegistrations: number;
}

interface TrendData {
  date: string;
  registrations: number;
  revenue: number;
  successfulPayments: number;
  averageRevenue: number;
}

interface PaymentAnalytics {
  paymentStatus: Array<{ _id: boolean; count: number; totalValue: number }>;
  revenueByDay: Array<{ date: string; revenue: number }>;
  topUsers: Array<{ name: string; email: string; amount: number; sessions: number }>;
}

interface SessionStats {
  totalSessions: number;
  averageSessions: number;
  maxSessions: number;
  usersWithSessions: number;
}

interface TransactionData {
  transactionsuccess: Transaction[];
  transactionfailed: Transaction[];
  allTransaction: Transaction[];
  totalFailed: number;
  totalSuccess: number;
  unproccessedTransaction: User[];
  unproccessedTransactionCount: number;
}

// Custom hook for debouncing
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Color constants for charts
const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1'
};

// Memoized Chart Components
const RegistrationTrendChart = React.memo<{ data: TrendData[]; period: string }>(({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: number, name: string) => [
            name === 'revenue' || name === 'averageRevenue' ? `₹${value.toLocaleString()}` : value,
            name.replace(/([A-Z])/g, ' $1').toLowerCase()
          ]}
        />
        <Legend />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="registrations"
          fill={CHART_COLORS.info}
          stroke={CHART_COLORS.primary}
          fillOpacity={0.2}
          name="Registrations"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="revenue"
          stroke={CHART_COLORS.success}
          strokeWidth={3}
          dot={{ fill: CHART_COLORS.success, strokeWidth: 2 }}
          name="Revenue (₹)"
        />
        <Bar
          yAxisId="left"
          dataKey="successfulPayments"
          fill={CHART_COLORS.warning}
          opacity={0.7}
          name="Successful Payments"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
});

const PaymentStatusChart = React.memo<{ analytics: PaymentAnalytics }>(({ analytics }) => {
  const pieData = useMemo(() =>
    analytics.paymentStatus.map((item) => ({
      name: item._id ? 'Completed' : 'Pending',
      value: item.count,
      color: item._id ? CHART_COLORS.success : CHART_COLORS.danger
    })), [analytics.paymentStatus]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-1/3">
        <ResponsiveContainer width="100%" height={250}>
          <RechartsPieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [value, 'Users']} />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>

      <div className="lg:w-2/3">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={analytics.revenueByDay.slice(-14)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']} />
            <Bar
              dataKey="revenue"
              fill={CHART_COLORS.success}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

// Memoized User Card Component
const UserCard = React.memo<{ user: User }>(({ user }) => {
  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  const formatTime = useCallback((dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }, []);

  const safeOrderId = user.orderId || 'N/A';
  const displayName = user.name || (user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Guest');
  const isTransactionComplete = user.transaction === true; // Explicit check or default false? careful

  return (
    <div className={`flex items-center justify-between p-4 border rounded-lg mb-4 ${isTransactionComplete ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
      }`}>
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isTransactionComplete ? 'bg-green-100' : 'bg-gray-100'
          }`}>
          {isTransactionComplete ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <User className="w-4 h-4 text-gray-600" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium">{displayName}</span>
            {user.isAdmin && (
              <Badge variant="destructive" className="text-xs">Admin</Badge>
            )}
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{user.email}</span>
            <Phone className="w-4 h-4 text-gray-400 ml-2" />
            <span className="text-sm text-gray-600">{user.phone}</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {user.orderId && (
              <span className="text-sm font-mono bg-white px-2 py-1 rounded border">
                {safeOrderId}
              </span>
            )}
            {user.transaction !== undefined && (
              <Badge variant={isTransactionComplete ? "default" : "secondary"} className={
                isTransactionComplete ? "bg-green-100 text-green-800" : ""
              }>
                {isTransactionComplete ? 'Payment Complete' : 'Payment Pending'}
              </Badge>
            )}
            {user.createdAt && (
              <span className="text-sm text-gray-500">
                {formatDate(user.createdAt)} • {formatTime(user.createdAt)}
              </span>
            )}
            {user.totalSessionAttended !== undefined && (
              <span className="text-sm text-gray-500">
                {user.totalSessionAttended} sessions
              </span>
            )}
            {/* Fallback for role if no transaction status */}
            {!user.transaction && user.role && (
              <Badge variant="outline" className="text-xs">{user.role}</Badge>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        {user.Value && user.Currency ? (
          <div className={`font-semibold ${isTransactionComplete ? 'text-green-600' : 'text-gray-600'}`}>
            {user.Currency} {user.Value}
          </div>
        ) : (
          null
        )}
        <div className="text-xs text-gray-500">
          Role: {user.role || 'User'}
        </div>
      </div>
    </div>
  );
});

// Memoized Transaction Card Component
const TransactionCard = React.memo<{ transaction: Transaction; isSuccess?: boolean }>(({ transaction, isSuccess: isSuccessProp }) => {
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  const isSuccess = isSuccessProp ?? (transaction.state === "COMPLETED");

  return (
    <div className={`flex items-center justify-between p-4 border rounded-lg mb-4 ${isSuccess ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
      }`}>
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSuccess ? 'bg-green-100' : 'bg-red-100'
          }`}>
          {isSuccess ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">
              {transaction.userId?.firstName} {transaction.userId?.lastName}
            </span>
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{transaction.userId?.email}</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Badge variant={isSuccess ? "default" : "destructive"} className={
              isSuccess ? "bg-green-100 text-green-800" : ""
            }>
              {transaction.state}
            </Badge>
            <span className="text-sm text-gray-500">
              {formatDate(transaction.createdAt)}
            </span>
            {transaction.amount && (
              <span className="text-sm font-semibold">
                {transaction.currency} {transaction.amount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Loading Skeleton Component
const LoadingSkeleton = React.memo(() => (
  <div className="p-6 space-y-6">
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
));

// Empty State Component
const EmptyState = React.memo<{ searchTerm: string; message?: string }>(({ searchTerm, message }) => (
  <div className="text-center py-12">
    <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      {searchTerm ? 'No items found' : message || 'No data available'}
    </h3>
    <p className="text-gray-600">
      {searchTerm
        ? 'Try adjusting your search terms'
        : 'Data will appear here once available'
      }
    </p>
  </div>
));

// Main Dashboard Component
const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [, setTransactions] = useState<TransactionData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    completedPayments: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    totalRegistrations: 0
  });
  const [trendsData, setTrendsData] = useState<TrendData[]>([]);
  const [paymentAnalytics, setPaymentAnalytics] = useState<PaymentAnalytics | null>(null);
  const [, setSessionStats] = useState<SessionStats | null>(null);
  const [reportsStats, setReportsStats] = useState<DashboardStats>({
    completedPayments: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    totalRegistrations: 0
  });
  const [reportsTransactions, setReportsTransactions] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [transactionSearchTerm, setTransactionSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('7d');
  const [reportsPeriod, setReportsPeriod] = useState('7d');

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedTransactionSearchTerm = useDebounce(transactionSearchTerm, 500);


  const navigate = useNavigate();
  // Filter users based on search term
  useEffect(() => {
    if (!debouncedSearchTerm) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (user.orderId && user.orderId.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (user.name && user.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (user.firstName && `${user.firstName} ${user.lastName}`.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        user.phone.includes(debouncedSearchTerm)
      );
      setFilteredUsers(filtered);
    }
  }, [users, debouncedSearchTerm]);


  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Corrected API endpoints based on your backend routes
      const [statsResponse, usersResponse, transactionsResponse, trendsResponse, paymentResponse, sessionResponse, ordersResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/dashboard-stats`, { 
          params: { period: chartPeriod },
          withCredentials: true 
        }),
        axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/users-with-all-transactions`, { withCredentials: true }), // Fixed endpoint
        axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/all-users-transaction`, { 
          params: { period: chartPeriod },
          withCredentials: true 
        }), // Fixed endpoint
        axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/registration-trends`, {
          params: { period: chartPeriod },
          withCredentials: true
        }),
        axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/payment-analytics`, { 
          params: { period: chartPeriod },
          withCredentials: true 
        }),
        axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/session-analytics`, { withCredentials: true }),
        axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/orders`, { withCredentials: true })
      ]);
      console.log( usersResponse)

      // Process stats response
      const baseStats = statsResponse.data.success ? statsResponse.data.stats : {
        completedPayments: 0,
        pendingPayments: 0,
        totalRevenue: 0,
        totalRegistrations: 0
      };

      // Users will be set after merging with unprocessed below

      if (transactionsResponse.data.success) {
        setTransactions(transactionsResponse.data);

        // Compute cutoff date for period filtering (client-side, since backend ignores period param)
        const now = new Date();
        const periodDays: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - (periodDays[chartPeriod] ?? 7));

        const filterByPeriod = (txList: Transaction[]) =>
          txList.filter(t => t.createdAt && new Date(t.createdAt) >= cutoff);

        const filteredSuccess = filterByPeriod(transactionsResponse.data.transactionsuccess || []);
        const filteredFailed = filterByPeriod(transactionsResponse.data.transactionfailed || []);
        const filteredUnprocessed = (transactionsResponse.data.unproccessedTransaction || []).filter(
          (o: any) => o.createdAt && new Date(o.createdAt) >= cutoff
        );

        const totalRevenueFromTransactions = filteredSuccess.reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);
        const unprocessedCount = filteredUnprocessed.length;

        setStats({
          completedPayments: filteredSuccess.length,
          pendingPayments: filteredFailed.length,
          totalRevenue: totalRevenueFromTransactions,
          totalRegistrations: filteredSuccess.length + filteredFailed.length + unprocessedCount
        });

        // Merge unprocessed users into the users list so all 5 show up in the Users tab
        const unprocessedUsers: User[] = (transactionsResponse.data.unproccessedTransaction || []).map((item: any) => ({
          _id: item.id || item._id || String(Math.random()),
          name: item.guestName || (item.lead?.name) || 'Guest',
          email: item.guestEmail || item.email || '',
          phone: item.guestPhone || item.phone || '',
          createdAt: item.createdAt,
          role: 'UNPROCESSED',
          transaction: false,
          transactionStatus: 'PENDING',
        }));
        if (usersResponse.data.success) {
          const existingEmails = new Set((usersResponse.data.users || []).map((u: User) => u.email));
          const newUnprocessed = unprocessedUsers.filter(u => u.email && !existingEmails.has(u.email));
          setUsers([...(usersResponse.data.users || []), ...newUnprocessed]);
        } else {
          setUsers(unprocessedUsers);
        }
      } else {
        setStats(baseStats);
        if (usersResponse.data.success) setUsers(usersResponse.data.users);
      }

      if (trendsResponse.data.success) setTrendsData(trendsResponse.data.trends);
      if (paymentResponse.data.success) setPaymentAnalytics(paymentResponse.data.analytics);
      if (sessionResponse.data.success) setSessionStats(sessionResponse.data.stats);
      setOrders(ordersResponse.data || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Log specific error details
      if (axios.isAxiosError(error)) {
        console.error('API Error:', error.response?.data);
        console.error('Status:', error.response?.status);
        console.error('URL:', error.config?.url);
      }
    } finally {
      setLoading(false);
    }
  }, [chartPeriod]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Fetch reports stats based on reportsPeriod
  useEffect(() => {
    const fetchReportsStats = async () => {
      try {
        const [statsResponse, transactionsResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/dashboard-stats`, { 
            params: { period: reportsPeriod },
            withCredentials: true 
          }),
          axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/all-users-transaction`, { 
            params: { period: reportsPeriod },
            withCredentials: true 
          })
        ]);

        if (statsResponse.data.success) {
          const baseStats = statsResponse.data.stats;
          
          if (transactionsResponse.data.success) {
            setReportsTransactions(transactionsResponse.data);
            
            const totalRevenueFromTransactions = transactionsResponse.data.transactionsuccess.reduce((sum: number, t: Transaction) => {
              return sum + (t.amount || 0);
            }, 0);
            
            setReportsStats({
              completedPayments: transactionsResponse.data.totalSuccess || baseStats.completedPayments,
              pendingPayments: transactionsResponse.data.totalFailed || baseStats.pendingPayments,
              totalRevenue: totalRevenueFromTransactions || baseStats.totalRevenue,
              totalRegistrations: baseStats.totalRegistrations || 0
            });
          } else {
            setReportsStats(baseStats);
          }
        }
      } catch (error) {
        console.error('Error fetching reports stats:', error);
      }
    };

    fetchReportsStats();
  }, [reportsPeriod]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const exportData = async (type: 'all' | 'success' | 'pending') => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/users-with-all-transactions`, { withCredentials: true });

      if (response.data.success) {
        let dataToExport = response.data.users;
        if (type === 'success') {
          dataToExport = dataToExport.filter((user: User) => user.transaction);
        } else if (type === 'pending') {
          dataToExport = dataToExport.filter((user: User) => !user.transaction);
        }

        const csvContent = convertToCSV(dataToExport);
        downloadCSV(csvContent, `${type}_users.csv`);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const convertToCSV = (data: User[]) => {
    const headers = ['Name', 'Email', 'Phone', 'Order ID', 'Status', 'Amount', 'Sessions', 'Created At'];
    const rows = data.map(user => [
      user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Guest',
      user.email,
      user.phone,
      user.orderId || 'N/A',
      user.transaction !== undefined ? (user.transaction ? 'Completed' : 'Pending') : 'N/A',
      user.Value && user.Currency ? `${user.Currency}${user.Value}` : 'N/A',
      (user.totalSessionAttended || 0).toString(),
      user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Overview Tab Content
  const getChartDataByPeriod = useCallback((data: TrendData[]) => {
    switch (chartPeriod) {
      case '7d':
        return data.slice(-7);
      case '30d':
        return data.slice(-30);
      case '90d':
        return data.slice(-90);
      case '1y':
        return data;
      default:
        return data.slice(-7);
    }
  }, [chartPeriod]);

  const OverviewTab = useMemo(() => (
    <div className="space-y-6">
      {/* Duration Selector */}
      <div className="flex justify-end">
        <Select value={chartPeriod} onValueChange={setChartPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedPayments}</p>
                <p className="text-sm text-gray-600">Completed Payments</p>
                <Badge variant="default" className="mt-1 bg-green-100 text-green-800">
                  Successful
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingPayments}</p>
                <p className="text-sm text-gray-600">Pending Payments</p>
                <Badge variant="destructive" className="mt-1">
                  Incomplete
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <Badge variant="secondary" className="mt-1">
                  Collected
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalRegistrations}</p>
                <p className="text-sm text-gray-600">Total Registrations</p>
                <Badge variant="secondary" className="mt-1 bg-purple-100 text-purple-800">
                  Registered
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Registration Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getChartDataByPeriod(trendsData)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="registrations"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getChartDataByPeriod(trendsData)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  ), [stats, trendsData, chartPeriod, getChartDataByPeriod]);

  // Users Tab Content
  const UsersTab = useMemo(() => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search users by email, name, phone, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => exportData('all')}>
            <Download className="w-4 h-4 mr-1" />
            Export All
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportData('success')}>
            <CheckCircle className="w-4 h-4 mr-1" />
            Success Only
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportData('pending')}>
            <XCircle className="w-4 h-4 mr-1" />
            Pending Only
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <EmptyState searchTerm={searchTerm} message="No users available" />
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <UserCard key={user._id} user={user} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  ), [filteredUsers, searchTerm]);

  // Orders Tab Content
  const OrdersTab = useMemo(() => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <EmptyState searchTerm="" message="No orders available" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.orderId || order.id.substring(0, 8)}...</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.user?.name || 'Guest'}</span>
                          <span className="text-xs text-muted-foreground">{order.user?.email || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-sm">{item.course.title}</div>
                        ))}
                      </TableCell>
                      <TableCell>₹{order.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'PAID' || order.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  ), [orders, navigate]);

  // Reports Tab Content
  const filteredReportsTransactions = useMemo(() => {
    if (!reportsTransactions) return { success: [], failed: [], all: [] };

    if (!debouncedTransactionSearchTerm) {
      return {
        success: reportsTransactions.transactionsuccess,
        failed: reportsTransactions.transactionfailed,
        all: reportsTransactions.allTransaction
      };
    }

    const filterTransaction = (transaction: Transaction) =>
      (transaction.userId?.email || '').toLowerCase().includes(debouncedTransactionSearchTerm.toLowerCase()) ||
      (transaction.userId?.firstName || '').toLowerCase().includes(debouncedTransactionSearchTerm.toLowerCase()) ||
      (transaction.userId?.lastName || '').toLowerCase().includes(debouncedTransactionSearchTerm.toLowerCase()) ||
      (transaction.state || '').toLowerCase().includes(debouncedTransactionSearchTerm.toLowerCase());

    return {
      success: reportsTransactions.transactionsuccess.filter(filterTransaction),
      failed: reportsTransactions.transactionfailed.filter(filterTransaction),
      all: reportsTransactions.allTransaction.filter(filterTransaction)
    };
  }, [reportsTransactions, debouncedTransactionSearchTerm]);

  const exportReportsCSV = useCallback(() => {
    if (!reportsTransactions) return;
    const allTx = [
      ...reportsTransactions.transactionsuccess.map(t => ({ ...t, type: 'Success' })),
      ...reportsTransactions.transactionfailed.map(t => ({ ...t, type: 'Failed' })),
    ];
    const headers = ['Name', 'Email', 'Status', 'Type', 'Amount', 'Currency', 'Date'];
    const rows = allTx.map(t => [
      `${t.userId?.firstName || ''} ${t.userId?.lastName || ''}`.trim() || 'Guest',
      t.userId?.email || '',
      t.state,
      t.type,
      t.amount || '',
      t.currency || 'INR',
      t.createdAt ? new Date(t.createdAt).toLocaleString() : ''
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(f => `"${f}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `reports_${reportsPeriod}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [reportsTransactions, reportsPeriod]);

  const ReportsTab = useMemo(() => (
    <div className="space-y-6">
      {/* Completed Payments & Total Revenue Section with Duration */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Payment Summary</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportReportsCSV} disabled={!reportsTransactions}>
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
            <Select value={reportsPeriod} onValueChange={setReportsPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{reportsStats.completedPayments}</p>
                  <p className="text-sm text-gray-600">Completed Payments</p>
                  <Badge variant="default" className="mt-1 bg-green-100 text-green-800">
                    Successful
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{reportsStats.totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <Badge variant="secondary" className="mt-1">
                    Collected
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search transactions by user, email, or status..."
            value={transactionSearchTerm}
            onChange={(e) => setTransactionSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {reportsTransactions && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-green-50 border-b border-green-200">
              <CardTitle className="text-sm font-medium text-green-900">Successful Transactions</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{reportsTransactions.totalSuccess}</div>
              <div className="text-xs text-muted-foreground">
                +{Math.round((reportsTransactions.totalSuccess / reportsTransactions.allTransaction.length) * 100)}% from total
              </div>
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {filteredReportsTransactions.success.map((transaction) => (
                  <TransactionCard key={transaction._id} transaction={transaction} isSuccess={true} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-red-50 border-b border-red-200">
              <CardTitle className="text-sm font-medium text-red-900">Failed Transactions</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{reportsTransactions.totalFailed}</div>
              <div className="text-xs text-muted-foreground">
                +{Math.round((reportsTransactions.totalFailed / reportsTransactions.allTransaction.length) * 100)}% from total
              </div>
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {filteredReportsTransactions.failed.map((transaction) => (
                  <TransactionCard key={transaction._id} transaction={transaction} isSuccess={false} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-orange-50 border-b border-orange-200">
              <CardTitle className="text-sm font-medium text-orange-900">Unprocessed Transactions</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{reportsTransactions.unproccessedTransactionCount}</div>
              <p className="text-xs text-muted-foreground">Pending manual processing</p>
              <div className="mt-4 space-y-2">
                {reportsTransactions.unproccessedTransaction.slice(0, 3).map((item: any) => {
                  const userObj = item.userId || item.user || item;


                  const email = item.guestEmail
                  const phone = item.guestPhone
                  const amount = item.totalAmount || item.amount;
                  const name = userObj.firstName
                    ? `${userObj.firstName} ${userObj.lastName || ''}`
                    : (userObj.name || item.lead?.name || 'Guest');

                  return (
                    <div key={item._id || userObj._id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-xs text-gray-600">{email}</p>
                        {phone && <p className="text-xs text-gray-500">Ph: {phone}</p>}
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="mb-1">Pending</Badge>
                        {amount && <p className="text-xs font-semibold">₹{amount}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  ), [reportsTransactions, filteredReportsTransactions, transactionSearchTerm, refreshing, handleRefresh, reportsStats, reportsPeriod, exportReportsCSV]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cashflow Crew Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into user registrations, payments, and engagement</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> {/* Reusing an icon or need to import CreditCard? Defaults to lucide-react usage elsewhere */}
            Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {OverviewTab}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Analytics Overview</h3>
            <Select value={chartPeriod} onValueChange={setChartPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registration & Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <RegistrationTrendChart data={trendsData} period={chartPeriod} />
            </CardContent>
          </Card>

          {paymentAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentStatusChart analytics={paymentAnalytics} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {UsersTab}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {ReportsTab}
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          {OrdersTab}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;