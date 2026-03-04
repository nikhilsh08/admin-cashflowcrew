import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Edit, Save, X, ArrowLeft, Calendar, Percent, Users, DollarSign, Tag, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import axios from "axios";
import { toast } from "sonner";
import { DateTimePicker } from "./ui/date-time-picker";

interface Coupon {
    id: string;
    code: string;
    discount: number;
    discountType: 'PERCENTAGE' | 'FIXED';
    expiryDate: string;
    usageLimit?: number | null;
    usedCount: number;
    minAmount: number;
    maxDiscount?: number | null;
    applicableCourseIds: string[];
    description?: string;
    isEnabled: boolean;
    createdAt: string;
    updatedAt?: string;
}

interface Course {
    id: string; // or _id depending on API
    title: string;
}

const CouponManagement = () => {
    const [view, setView] = useState<"list" | "form">("list");
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [isEnabled, setIsEnabled] = useState<boolean>(true);
    const [applicableTo, setApplicableTo] = useState<"all" | "specific">("all");
    const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<Partial<Coupon>>({
        defaultValues: {
            code: "",
            discount: 0,
            discountType: "PERCENTAGE",
            usageLimit: undefined,
            minAmount: 0,
            maxDiscount: undefined,
            applicableCourseIds: [],
            description: "",
            isEnabled: true,
        },
    });

    const discountType = watch("discountType");

    const getCoupons = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/coupons`, { withCredentials: true });
            setCoupons(Array.isArray(res.data) ? res.data : res.data.coupons || []);
        } catch (error) {
            console.error("Error fetching coupons:", error);
            toast.error("Failed to fetch coupons");
        }
    };

    const getCourses = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/masterclass/all-classes`, { withCredentials: true });
            // Handle both structure possibilities based on previous knowledge
            const courseList = res.data.courses || res.data.data || [];
            // Map _id to id if necessary, though new helper might not be needed if we just use .id consistently
            setCourses(courseList.map((c: any) => ({ id: c.id || c._id, title: c.title })));
        } catch (error) {
            console.error("Error fetching courses:", error);
        }
    };

    useEffect(() => {
        getCoupons();
        getCourses();
    }, []);

    const handleCreate = () => {
        setEditingCoupon(null);
        reset({
            code: "",
            discount: 0,
            discountType: "PERCENTAGE",
            usageLimit: undefined,
            minAmount: 0,
            maxDiscount: undefined,
            applicableCourseIds: [],
            description: "",
            isEnabled: true,
        });
        setIsEnabled(true);
        setExpiryDate(undefined);
        setApplicableTo("all");
        setView("form");
    };

    const handleEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        reset(coupon);
        setIsEnabled(coupon.isEnabled);
        setExpiryDate(coupon.expiryDate ? new Date(coupon.expiryDate) : undefined);
        setApplicableTo(coupon.applicableCourseIds && coupon.applicableCourseIds.length > 0 ? "specific" : "all");
        setView("form");
    };

    const onSubmit = async (data: Partial<Coupon>) => {
        if (!expiryDate) {
            toast.error("Please select an expiry date");
            return;
        }
        const submitData = {
            ...data,
            isEnabled,
            expiryDate: expiryDate.toISOString(),
            usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
            maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : undefined,
            discount: Number(data.discount),
            minAmount: Number(data.minAmount) || 0,
            applicableCourseIds: applicableTo === "all" ? [] : (Array.isArray(data.applicableCourseIds) ? data.applicableCourseIds : [])
        };

        try {
            if (editingCoupon) {
                // No full-update endpoint — delete and recreate
                await axios.delete(
                    `${import.meta.env.VITE_SERVER_URL}/api/admin/coupons/${editingCoupon.id}`,
                    { withCredentials: true }
                );
                await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/admin/coupons`,
                    submitData,
                    { withCredentials: true }
                );
                toast.success("Coupon updated successfully!");
            } else {
                await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/admin/coupons`,
                    submitData,
                    { withCredentials: true }
                );
                toast.success("Coupon created successfully!");
            }
            getCoupons();
            setView("list");
        } catch (error: any) {
            console.error("Error saving coupon:", error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || "Failed to save coupon. Please try again.";
            toast.error(errorMessage);
        }
    };

    const handleToggle = async (coupon: Coupon) => {
        try {
            await axios.patch(
                `${import.meta.env.VITE_SERVER_URL}/api/admin/coupons/${coupon.id}`,
                { isEnabled: !coupon.isEnabled },
                { withCredentials: true }
            );
            toast.success(`Coupon ${!coupon.isEnabled ? 'enabled' : 'disabled'} successfully!`);
            getCoupons();
        } catch (error) {
            console.error("Error toggling coupon:", error);
            toast.error("Failed to toggle coupon status");
        }
    };

    const handleDelete = async (couponId: string) => {
        if (!window.confirm("Are you sure you want to delete this coupon?")) return;

        try {
            await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/admin/coupons/${couponId}`, { withCredentials: true });
            toast.success("Coupon deleted successfully!");
            getCoupons();
        } catch (error) {
            console.error("Error deleting coupon:", error);
            toast.error("Failed to delete coupon");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDiscount = (discount: number, type: string) => {
        return type === 'PERCENTAGE' ? `${discount}%` : `₹${discount}`;
    };

    const getStatusColor = (coupon: Coupon) => {
        const isExpired = new Date(coupon.expiryDate) < new Date();
        const isLimitReached = coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;

        if (!coupon.isEnabled) return 'bg-gray-100 text-gray-800';
        if (isExpired) return 'bg-red-100 text-red-800';
        if (isLimitReached) return 'bg-orange-100 text-orange-800';
        return 'bg-green-100 text-green-800';
    };

    const getStatusText = (coupon: Coupon) => {
        const isExpired = new Date(coupon.expiryDate) < new Date();
        const isLimitReached = coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;

        if (!coupon.isEnabled) return 'Disabled';
        if (isExpired) return 'Expired';
        if (isLimitReached) return 'Limit Reached';
        return 'Active';
    };

    if (view === "form") {
        return (
            <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="outline"
                            onClick={() => setView("list")}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to List
                        </Button>
                        <h1 className="text-2xl md:text-3xl font-bold">
                            {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
                        </h1>
                    </div>

                    {/* Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {editingCoupon ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                Coupon Details
                            </CardTitle>
                            <CardDescription>
                                {editingCoupon
                                    ? "Update the coupon information below"
                                    : "Fill in the details to create a new coupon"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                {/* Code + Discount Type */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="py-1">Coupon Code *</Label>
                                        <Input
                                            {...register("code", { required: "Coupon code is required" })}
                                            placeholder="e.g. SAVE20, WELCOME50"
                                            className="uppercase"
                                        />
                                        {errors.code && <p className="text-red-500 text-sm">{errors.code.message}</p>}
                                    </div>
                                    <div>
                                        <Label className="py-1">Discount Type *</Label>
                                        <select {...register("discountType")} className="w-full border rounded px-3 py-2">
                                            <option value="PERCENTAGE">Percentage (%)</option>
                                            <option value="FIXED">Fixed Amount (₹)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Discount + Maximum Discount */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="py-1">
                                            Discount Value * {discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}
                                        </Label>
                                        <Input
                                            type="number"
                                            {...register("discount", { required: "Discount is required" })}
                                            min="0"
                                            max={discountType === 'PERCENTAGE' ? "100" : undefined}
                                        />
                                        {errors.discount && <p className="text-red-500 text-sm">{errors.discount.message}</p>}
                                    </div>
                                    {discountType === 'PERCENTAGE' && (
                                        <div>
                                            <Label className="py-1">Maximum Discount Amount (₹)</Label>
                                            <Input
                                                type="number"
                                                {...register("maxDiscount")}
                                                placeholder="Optional - Leave blank for no limit"
                                                min="0"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <Label className="py-1">Description</Label>
                                    <Textarea
                                        {...register("description")}
                                        rows={3}
                                        placeholder="Brief description of the coupon offer"
                                    />
                                </div>

                                {/* Expiry Date + Usage Limit */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="py-1">Expiry Date *</Label>
                                        <DateTimePicker
                                            date={expiryDate}
                                            setDate={setExpiryDate}
                                        />
                                        {!expiryDate && <p className="text-red-500 text-sm mt-1">Expiry date is required</p>}
                                    </div>
                                    <div>
                                        <Label className="py-1">Usage Limit</Label>
                                        <Input
                                            type="number"
                                            {...register("usageLimit")}
                                            placeholder="Leave blank for unlimited uses"
                                            min="1"
                                        />
                                    </div>
                                </div>

                                {/* Minimum Amount + Applicable Products */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="py-1">Minimum Order Amount (₹)</Label>
                                        <Input
                                            type="number"
                                            {...register("minAmount")}
                                            placeholder="0 for no minimum"
                                            min="0"
                                        />
                                    </div>

                                    <div>
                                        <Label className="py-1">Applicable To</Label>
                                        <select
                                            value={applicableTo}
                                            onChange={(e) => {
                                                const val = e.target.value as "all" | "specific";
                                                setApplicableTo(val);
                                            }}
                                            className="w-full border rounded px-3 py-2 mb-2"
                                        >
                                            <option value="all">All Courses</option>
                                            <option value="specific">Specific Courses</option>
                                        </select>

                                        {applicableTo === "specific" && (
                                            <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                                                {courses.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground">No courses found.</p>
                                                ) : (
                                                    courses.map(course => (
                                                        <div key={course.id} className="flex items-center space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`course-${course.id}`}
                                                                value={course.id}
                                                                {...register("applicableCourseIds")}
                                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                            />
                                                            <Label htmlFor={`course-${course.id}`} className="text-sm font-normal cursor-pointer">
                                                                {course.title}
                                                            </Label>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                        {applicableTo === "specific" && errors.applicableCourseIds && (
                                            <p className="text-red-500 text-sm mt-1">Please select at least one course</p>
                                        )}
                                    </div>
                                </div>

                                {/* Enable/Disable Switch */}
                                <div className="flex items-center gap-2">
                                    <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
                                    <Label>Enable Coupon</Label>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-4 pt-4">
                                    <Button type="submit" className="flex items-center gap-2">
                                        <Save className="h-4 w-4" />
                                        {editingCoupon ? "Update Coupon" : "Create Coupon"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setView("list")}
                                        className="flex items-center gap-2"
                                    >
                                        <X className="h-4 w-4" />
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Coupon Management</h1>
                        <p className="text-muted-foreground mt-2">
                            Create, manage, and track your promotional coupons
                        </p>
                    </div>
                    <Button onClick={handleCreate} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create New Coupon
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
                            <Tag className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{coupons.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
                            <Percent className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {coupons.filter(c => c.isEnabled && new Date(c.expiryDate) > new Date()).length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                            <Users className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {coupons.reduce((sum, c) => sum + c.usedCount, 0)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Discount</CardTitle>
                            <DollarSign className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {coupons.length > 0
                                    ? Math.round(coupons.reduce((sum, c) => sum + c.discount, 0) / coupons.length)
                                    : 0}%
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Coupon List */}
                <div className="space-y-4">
                    {coupons.map((coupon) => (
                        <Card key={coupon.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-xl font-semibold font-mono">{coupon.code}</h3>
                                            <Badge className={getStatusColor(coupon)}>
                                                {getStatusText(coupon)}
                                            </Badge>
                                            <Badge variant="outline">
                                                {formatDiscount(coupon.discount, coupon.discountType)}
                                            </Badge>
                                        </div>

                                        {coupon.description && (
                                            <p className="text-muted-foreground">{coupon.description}</p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                Expires: {formatDate(coupon.expiryDate)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''} used
                                            </div>
                                            {coupon.minAmount > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <DollarSign className="h-4 w-4" />
                                                    Min: ₹{coupon.minAmount}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm">
                                            <span>Type: {coupon.discountType === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amount'}</span>
                                            <span>Applies to: {coupon.applicableCourseIds.length > 0 ? `${coupon.applicableCourseIds.length} Courses` : 'All Courses'}</span>
                                            {coupon.maxDiscount && (
                                                <span>Max discount: ₹{coupon.maxDiscount}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleToggle(coupon)}
                                            className="flex items-center gap-2"
                                        >
                                            {coupon.isEnabled ? 'Disable' : 'Enable'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(coupon)}
                                            className="flex items-center gap-2"
                                        >
                                            <Edit className="h-4 w-4" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(coupon.id)}
                                            className="flex items-center gap-2 text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {coupons.length === 0 && (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">No coupons yet</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    Get started by creating your first promotional coupon
                                </p>
                                <Button onClick={handleCreate} className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create Your First Coupon
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CouponManagement;