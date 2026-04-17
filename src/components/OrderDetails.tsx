import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Mail, Phone, Calendar, CreditCard, User as UserIcon, BookOpen, Package, TrendingUp, Tag } from 'lucide-react';

interface OrderItem {
    id: string;
    price: number;
    course: {
        title: string;
        price: number;
    };
}

interface BundleOrderItem {
    id: string;
    price: number;
    bundle: {
        name: string;
        slug: string;
        price: number;
        originalPrice: number | null;
        courseIds: string[];
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
    discountAmount: number;
    status: string;
    createdAt: string;
    orderId: string | null;
    couponId: string | null;
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
    bundleItems: BundleOrderItem[];
    purchasedCourseDetails?: {
        id: string;
        title: string;
        price: number;
        source: 'DIRECT' | 'BUNDLE';
        bundleNames?: string[];
    }[];
    paymentTransaction: PaymentTransaction | null;
    guestEmail: string | null;
    guestPhone: string | null;
    // UTM Marketing Attribution
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    utmTerm: string | null;
    utmContent: string | null;
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
    const productCount = (order.items?.length || 0) + (order.bundleItems?.length || 0);

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
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-500">ID: {order.orderId || order.id}</p>
                            <Badge variant="secondary" className="text-xs">{productCount} products</Badge>
                        </div>
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
                                {/* Bundle Items */}
                                {order.bundleItems && order.bundleItems.length > 0 && (
                                    <>
                                        <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                            <Package className="w-4 h-4" />
                                            Bundles
                                        </div>
                                        {order.bundleItems.map((item) => (
                                            <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                                                <div>
                                                    <h4 className="font-semibold text-lg">{item.bundle.name}</h4>
                                                    <p className="text-sm text-gray-500">
                                                        Bundle • {item.bundle.courseIds?.length || 0} courses included
                                                    </p>
                                                    {item.bundle.originalPrice && (
                                                        <p className="text-xs text-green-600 mt-1">
                                                            Saved ₹{(item.bundle.originalPrice - item.price).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-semibold">
                                                        ₹{item.price.toLocaleString()}
                                                    </div>
                                                    {item.bundle.originalPrice && (
                                                        <div className="text-sm text-gray-400 line-through">
                                                            ₹{item.bundle.originalPrice.toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {order.items.length > 0 && <Separator className="my-4" />}
                                    </>
                                )}

                                {/* Individual Course Items */}
                                {order.items.length > 0 && (
                                    <>
                                        <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                            <BookOpen className="w-4 h-4" />
                                            Individual Courses
                                        </div>
                                        {order.items.map((item) => (
                                            <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg bg-white">
                                                <div>
                                                    <h4 className="font-semibold text-lg">{item.course.title}</h4>
                                                    <p className="text-sm text-gray-500">Course Type: Recorded</p>
                                                </div>
                                                <div className="font-semibold">
                                                    ₹{item.price.toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {/* Empty State */}
                                {order.items.length === 0 && (!order.bundleItems || order.bundleItems.length === 0) && (
                                    <div className="text-center py-8 text-gray-500">
                                        No items found in this order
                                    </div>
                                )}

                                <Separator className="my-4" />

                                {order.purchasedCourseDetails && order.purchasedCourseDetails.length > 0 && (
                                    <>
                                        <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                            <BookOpen className="w-4 h-4" />
                                            Purchased Course Details
                                        </div>
                                        <div className="space-y-2">
                                            {order.purchasedCourseDetails.map((course, index) => (
                                                <div key={`${course.id}-${course.source}-${index}`} className="flex items-start justify-between p-3 border rounded-lg bg-gray-50">
                                                    <div>
                                                        <div className="font-medium text-sm">{course.title}</div>
                                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                            <Badge variant="outline" className="text-[10px] h-5">
                                                                {course.source === 'DIRECT' ? 'Direct' : 'Bundle'}
                                                            </Badge>
                                                            {course.bundleNames && course.bundleNames.length > 0 && (
                                                                <span>From: {course.bundleNames.join(', ')}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="font-semibold text-sm">₹{course.price.toLocaleString()}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <Separator className="my-4" />
                                    </>
                                )}

                                {/* Order Summary */}
                                <div className="space-y-2">
                                    {order.couponId && (
                                        <div className="flex justify-between items-center text-sm text-purple-600">
                                            <span className="flex items-center gap-1">
                                                <Tag className="w-3 h-3" />
                                                Coupon Applied
                                            </span>
                                            <span className="font-mono text-xs bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                                                {order.couponId}
                                            </span>
                                        </div>
                                    )}
                                    {order.discountAmount > 0 && (
                                        <div className="flex justify-between items-center text-sm text-green-600">
                                            <span>Discount Applied</span>
                                            <span>-₹{order.discountAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center font-semibold text-base border-t pt-2 mt-2">
                                        <span>Total Paid</span>
                                        <span>₹{order.totalAmount.toLocaleString()}</span>
                                    </div>
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
                                    <p className="text-xs text-gray-500">
                                        {order.user ? 'Registered User' : order.lead ? 'Lead (Guest)' : 'Guest'}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm break-all">{userEmail}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">{userPhone}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">
                                        Order Date: {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* UTM / Marketing Attribution */}
                    {(order.utmSource || order.utmMedium || order.utmCampaign || order.utmTerm || order.utmContent) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-gray-500" />
                                    Marketing Attribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {order.utmSource && (
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Source</p>
                                            <p className="text-sm font-medium mt-0.5">
                                                <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5 font-mono text-xs">
                                                    {order.utmSource}
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                    {order.utmMedium && (
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Medium</p>
                                            <p className="text-sm font-medium mt-0.5">
                                                <span className="inline-block bg-green-50 text-green-700 border border-green-200 rounded px-2 py-0.5 font-mono text-xs">
                                                    {order.utmMedium}
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                    {order.utmCampaign && (
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Campaign</p>
                                            <p className="text-sm font-medium mt-0.5">
                                                <span className="inline-block bg-orange-50 text-orange-700 border border-orange-200 rounded px-2 py-0.5 font-mono text-xs break-all">
                                                    {order.utmCampaign}
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                    {order.utmTerm && (
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Term</p>
                                            <p className="text-sm font-medium mt-0.5">
                                                <span className="inline-block bg-purple-50 text-purple-700 border border-purple-200 rounded px-2 py-0.5 font-mono text-xs break-all">
                                                    {order.utmTerm}
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                    {order.utmContent && (
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Content</p>
                                            <p className="text-sm font-medium mt-0.5">
                                                <span className="inline-block bg-pink-50 text-pink-700 border border-pink-200 rounded px-2 py-0.5 font-mono text-xs break-all">
                                                    {order.utmContent}
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
