import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Mail, Phone, Calendar, CreditCard, User as UserIcon, BookOpen } from 'lucide-react';

interface OrderItem {
    id: string;
    price: number;
    course: {
        title: string;
        price: number;
    };
}

interface PaymentTransaction {
    id: string;
    paymentId: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string | null;
    createdAt: string;
}

interface OrderDetail {
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    orderId: string | null;
    user: {
        name: string | null;
        email: string;
        phone: string | null;
    } | null;
    lead: {
        name: string | null;
        email: string;
        phone: string | null;
    } | null;
    items: OrderItem[];
    paymentTransaction: PaymentTransaction | null;
    guestEmail: string | null;
    guestPhone: string | null;
}

const OrderDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/orders/${id}`, {
                    withCredentials: true
                });
                setOrder(response.data);
            } catch (err) {
                console.error("Error fetching order details:", err);
                setError("Failed to load order details");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchOrderDetails();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-64 md:col-span-2" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[50vh] text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Order</h2>
                <p className="text-gray-600 mb-6">{error || "Order not found"}</p>
                <Button onClick={() => navigate(-1)} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    const userEmail = order.user?.email || order.lead?.email || order.guestEmail || 'N/A';
    const userName = order.user?.name || order.lead?.name || 'Guest';
    const userPhone = order.user?.phone || order.lead?.phone || order.guestPhone || 'N/A';

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'default'; // default is usually black/primary, relying on className for specific colors if needed
            case 'COMPLETED': return 'default';
            case 'PENDING': return 'secondary';
            case 'FAILED': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                        <p className="text-sm text-gray-500">ID: {order.orderId || order.id}</p>
                    </div>
                </div>
                <Badge variant={getStatusColor(order.status) as any} className="text-sm px-3 py-1">
                    {order.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-gray-500" />
                                Purchased Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg bg-white">
                                        <div>
                                            <h4 className="font-semibold text-lg">{item.course.title}</h4>
                                            <p className="text-sm text-gray-500">Course Type: Recorded</p> {/* Assumption based on schema default */}
                                        </div>
                                        <div className="font-semibold">
                                            ₹{item.price.toLocaleString()}
                                        </div>
                                    </div>
                                ))}

                                <Separator className="my-4" />

                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total Amount</span>
                                    <span>₹{order.totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Transaction Details */}
                    {order.paymentTransaction && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-gray-500" />
                                    Payment Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Transaction ID</p>
                                        <p className="font-medium font-mono text-sm">{order.paymentTransaction.paymentId}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Payment Method</p>
                                        <p className="font-medium">{order.paymentTransaction.paymentMethod || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Date</p>
                                        <p className="font-medium">{new Date(order.paymentTransaction.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <Badge variant="outline" className="mt-1">{order.paymentTransaction.status}</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar - Right Column */}
                <div className="space-y-6">
                    {/* Customer Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-gray-500" />
                                Customer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                    <span className="text-lg font-semibold text-gray-600">
                                        {userName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-medium">{userName}</p>
                                    <p className="text-xs text-gray-500">Customer</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">{userEmail}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">{userPhone}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">
                                        Registered: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
