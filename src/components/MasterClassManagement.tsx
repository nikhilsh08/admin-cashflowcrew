import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Plus, Edit, Save, X, ArrowLeft, Calendar, Clock, Users, DollarSign, MapPin, Eye, Download, ListChecks } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "./ui/badge";
import axios from "axios";
import { toast } from "sonner";
import { DateTimePicker } from "./ui/date-time-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import TiptapEditor from "./TiptapEditor";

interface Category {
    id: string;
    name: string;
}

interface Masterclass {
    _id: string;
    id?: string;
    title: string;
    subHeading?: string;
    description: string;
    content?: string;
    status: string;
    price: number;
    originalPrice?: number;
    thumbnail?: string;
    type: 'RECORDED' | 'LIVE' | 'HYBRID';
    duration?: string;
    tcCourseId: string;
    tcCourseUrl?: string;
    startDate?: string;
    maxSeats?: number;
    categoryId: string;
    category?: Category;
    staticRoute?: string;
    visibility: 'show' | 'hide';
    isPublished?: boolean;
    seatsSold?: number;
    // Legacy/display fields
    registrations?: number;
    location?: string;
    instructor?: string;
    date?: string;
}

interface WaitlistUser {
    id: string;
    email: string;
    courseId: string;
    status: string;
    createdAt: string;
}

const MasterclassManagement = () => {
    const [view, setView] = useState<"list" | "form">("list");
    const [editingMasterclass, setEditingMasterclass] = useState<Masterclass | null>(null);
    const [masterclasses, setMasterclasses] = useState<Masterclass[]>([]);
    const [showRichContent, setShowRichContent] = useState(false);

    // Waitlist State
    const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
    const [waitlistUsers, setWaitlistUsers] = useState<WaitlistUser[]>([]);
    const [selectedMasterclassName, setSelectedMasterclassName] = useState("");
    const [isLoadingWaitlist, setIsLoadingWaitlist] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        control,
        formState: { errors },
    } = useForm<Partial<Masterclass>>({
        defaultValues: {
            title: "",
            subHeading: "",
            description: "",
            content: "",
            status: "Coming Soon",
            price: 0,
            originalPrice: undefined,
            thumbnail: "",
            type: "RECORDED",
            tcCourseId: "",
            tcCourseUrl: "",
            startDate: "",
            maxSeats: undefined,
            categoryId: "",
            staticRoute: "",
            visibility: "show",
            isPublished: true,
            duration: "",
        },
    });

    const watchType = watch("type");

    const [categories, setCategories] = useState<Category[]>([]);

    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/category`, { withCredentials: true });
            if (res.data.success) {
                setCategories(res.data.categories);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            // toast.error("Failed to load categories");
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);
    const getMasterClasses = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/masterclass/all-classes`, { withCredentials: true });
            console.log("responsesss", res.data.data) // Verify if data.data or data.courses
            setMasterclasses(res.data.courses || res.data.data || []);
        } catch (error) {
            console.error("Error fetching masterclasses:", error);
        }
    }

    useEffect(() => {
        getMasterClasses();
    }, []);

    const fetchWaitlist = async (masterclassId: string, title: string) => {
        setIsWaitlistModalOpen(true);
        setSelectedMasterclassName(title);
        setIsLoadingWaitlist(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/masterclass/${masterclassId}`, { withCredentials: true });
            if (res.data.success && res.data.waitlist) {
                setWaitlistUsers(res.data.waitlist.users || []);
            } else {
                setWaitlistUsers([]);
            }
        } catch (error) {
            console.error("Error fetching waitlist:", error);
            toast.error("Failed to load waitlist data");
            setWaitlistUsers([]);
        } finally {
            setIsLoadingWaitlist(false);
        }
    };

    const exportWaitlistCsv = () => {
        if (waitlistUsers.length === 0) {
            toast.error("No waitlist users to export");
            return;
        }

        const headers = ["Email", "Status", "Joined At"];
        const csvContent = [
            headers.join(","),
            ...waitlistUsers.map(user =>
                `${user.email},${user.status},${new Date(user.createdAt).toLocaleString()}`
            )
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `waitlist_${selectedMasterclassName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCreate = () => {
        setEditingMasterclass(null);
        setShowRichContent(false);
        reset({
            title: "",
            subHeading: "",
            description: "",
            content: "",
            status: "Coming Soon",
            price: 0,
            originalPrice: undefined,
            thumbnail: "",
            type: "RECORDED",
            tcCourseId: "",
            tcCourseUrl: "",
            startDate: "",
            maxSeats: undefined,
            categoryId: "",
            staticRoute: "",
            visibility: "show",
            isPublished: true,
            duration: "",
        });
        setView("form");
    };

    const handleEdit = (masterclass: Masterclass) => {
        setEditingMasterclass(masterclass);
        setShowRichContent(false);

        let formattedDate = "";
        if (masterclass.startDate) {
            const dateObj = new Date(masterclass.startDate);
            // Format to YYYY-MM-DDThh:mm
            const pad = (n: number) => n.toString().padStart(2, '0');
            formattedDate = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
        }

        reset({
            ...masterclass,
            startDate: formattedDate
        });
        setView("form");
    };

    const onSubmit = async (data: Partial<Masterclass>) => {
        // Helper: treat empty strings as null (not undefined) so the backend
        // receives the field and clears it in the DB. Using `|| undefined` would
        // drop the field from the JSON body entirely, leaving the old value untouched.
        const nullIfEmpty = (val?: string) => (val && val.trim() !== '' ? val : null);

        const payload = {
            title: data.title,
            subHeading: nullIfEmpty(data.subHeading),
            description: data.description,
            content: nullIfEmpty(data.content),
            status: data.status || 'Coming Soon',
            price: Number(data.price),
            originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
            thumbnail: nullIfEmpty(data.thumbnail),
            type: data.type,
            tcCourseId: data.tcCourseId,
            tcCourseUrl: nullIfEmpty(data.tcCourseUrl),
            startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
            maxSeats: data.maxSeats ? Number(data.maxSeats) : null,
            categoryId: data.categoryId,
            staticRoute: nullIfEmpty(data.staticRoute),
            visibility: data.visibility || 'show',
            isPublished: typeof data.isPublished === 'string' ? data.isPublished === 'true' : (data.isPublished ?? true),
            duration: (data.type === 'LIVE' || data.type === 'HYBRID') ? (nullIfEmpty(data.duration)) : null,
        };

        if (editingMasterclass) {
            // update
            try {
                const res = await axios.patch(`${import.meta.env.VITE_SERVER_URL}/api/admin/masterclass/update/${editingMasterclass.id || editingMasterclass._id}`, payload, { withCredentials: true });
                if (res.data.success) {
                    toast.success("Masterclass updated successfully");
                    getMasterClasses(); // Refresh list
                    setView("list");
                }
            } catch (error) {
                console.error("Error updating masterclass:", error);
                toast.error("Failed to update masterclass. Please try again.");
            }
        } else {
            // create
            try {
                const res = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/admin/masterclass/create`, payload, { withCredentials: true });
                if (res.data.success) {
                    toast.success("Masterclass created successfully");
                    getMasterClasses(); // Refresh list
                    setView("list");
                }
            } catch (error) {
                console.error("Error creating masterclass:", error);
                toast.error("Failed to create masterclass. Please try again.");
            }
        }
    };
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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
                            {editingMasterclass ? "Edit Masterclass" : "Create New Masterclass"}
                        </h1>
                    </div>

                    {/* Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {editingMasterclass ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                Masterclass Details
                            </CardTitle>
                            <CardDescription>
                                {editingMasterclass
                                    ? "Update the masterclass information below"
                                    : "Fill in the details to create a new masterclass"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                {/* Title */}
                                <div>
                                    <Label className="py-1">Title *</Label>
                                    <Input {...register("title", { required: "Title is required" })} />
                                    {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
                                </div>

                                {/* SubHeading */}
                                <div>
                                    <Label className="py-1">SubHeading</Label>
                                    <Input {...register("subHeading")} placeholder="Optional sub-heading" />
                                </div>

                                {/* Description */}
                                <div>
                                    <Label className="py-1">Description *</Label>
                                    <Textarea {...register("description", { required: "Description is required" })} rows={4} />
                                    {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                                </div>

                                {/* Rich Content (Optional) with Toggle */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="py-1">Rich Content (Optional)</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowRichContent(!showRichContent)}
                                            className="text-xs"
                                        >
                                            {showRichContent ? 'Hide Editor' : 'Show Editor'}
                                        </Button>
                                    </div>
                                    {showRichContent && (
                                        <>
                                            <p className="text-xs text-gray-500 mb-2">Add detailed formatted content with images, tables, code blocks, etc.</p>
                                            <Controller
                                                name="content"
                                                control={control}
                                                render={({ field }) => (
                                                    <TiptapEditor
                                                        content={field.value || ''}
                                                        onChange={field.onChange}
                                                        placeholder="Add detailed content here..."
                                                    />
                                                )}
                                            />
                                        </>
                                    )}
                                </div>

                                {/* Type + Category */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="py-1">Type *</Label>
                                        <select {...register("type", { required: "Type is required" })} className="w-full border rounded px-3 py-2">
                                            <option value="RECORDED">Recorded</option>
                                            <option value="LIVE">Live</option>
                                            <option value="HYBRID">Hybrid</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="py-1">Category *</Label>
                                        <select {...register("categoryId", { required: "Category is required" })} className="w-full border rounded px-3 py-2">
                                            <option value="">Select Category</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.categoryId && <p className="text-red-500 text-sm">{errors.categoryId.message}</p>}
                                    </div>
                                </div>

                                {/* Status + IsPublished */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="py-1">Status *</Label>
                                        <select {...register("status", { required: "Status is required" })} className="w-full border rounded px-3 py-2">
                                            <option value="Available">Available</option>
                                            <option value="Coming Soon">Coming Soon</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="py-1">Published *</Label>
                                        <select {...register("isPublished")} className="w-full border rounded px-3 py-2">
                                            <option value="true">Yes</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Price + Original Price */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="py-1">Price *</Label>
                                        <Input type="number" {...register("price", { required: "Price is required" })} />
                                        {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
                                    </div>
                                    <div>
                                        <Label className="py-1">Original Price</Label>
                                        <Input type="number" {...register("originalPrice")} />
                                    </div>
                                </div>

                                {/* Start Date + Max Seats + Duration conditionally shown for LIVE & HYBRID */}
                                {(watchType === "LIVE" || watchType === "HYBRID") && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="py-1">Session Date and Time</Label>
                                                <Controller
                                                    name="startDate"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <DateTimePicker
                                                            date={field.value ? new Date(field.value) : undefined}
                                                            setDate={(date: Date | undefined) => field.onChange(date ? date.toISOString() : undefined)}
                                                        />
                                                    )}
                                                />
                                            </div>
                                            <div>
                                                <Label className="py-1">Max Seats</Label>
                                                <Input type="number" {...register("maxSeats")} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="py-1">Duration</Label>
                                                <select {...register("duration")} className="w-full border rounded px-3 py-2">
                                                    <option value="">Select Duration</option>
                                                    <option value="1 Hour">1 Hour</option>
                                                    <option value="2 Hours">2 Hours</option>
                                                    <option value="3 Hours">3 Hours</option>
                                                    <option value="4 Hours">4 Hours</option>
                                                    <option value="6 Hours">6 Hours</option>
                                                    <option value="8 Hours">8 Hours</option>
                                                    <option value="1 Day">1 Day</option>
                                                    <option value="2 Days">2 Days</option>
                                                    <option value="3 Days">3 Days</option>
                                                </select>
                                            </div>
                                            <div />
                                        </div>
                                    </>
                                )}

                                {/* Trainer Central Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="py-1">Trainer Central Course ID *</Label>
                                        <Input {...register("tcCourseId", { required: "TC Course ID is required" })} />
                                        {errors.tcCourseId && <p className="text-red-500 text-sm">{errors.tcCourseId.message}</p>}
                                    </div>
                                    <div>
                                        <Label className="py-1">Trainer Central Course URL</Label>
                                        <Input type="url" {...register("tcCourseUrl")} />
                                    </div>
                                </div>

                                {/* Thumbnail */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="py-1">Thumbnail URL</Label>
                                        <Input type="url" {...register("thumbnail")} />
                                    </div>
                                    {/* Empty div to keep the grid layout aligned if needed, or you could adjust the grid cols */}
                                    <div></div>
                                </div>

                                {/* Visibility + Static Route */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="py-1">Static Route</Label>
                                        <Input {...register("staticRoute")} placeholder="/course-page" />
                                    </div>
                                    <div>
                                        <Label className="py-1">Visibility</Label>
                                        <select {...register("visibility")} className="w-full border rounded px-3 py-2">
                                            <option value="show">Show</option>
                                            <option value="hide">Hide</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-4 pt-4">
                                    <Button type="submit" className="flex cursor-pointer items-center gap-2">
                                        <Save className="h-4 w-4" />
                                        {editingMasterclass ? "Update Masterclass" : "Create Masterclass"}
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
                        <h1 className="text-2xl md:text-3xl font-bold">Masterclass Management</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage all your masterclasses, track registrations, and edit details
                        </p>
                    </div>
                    <Button onClick={handleCreate} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create New Masterclass
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Masterclasses</CardTitle>
                            <Calendar className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{masterclasses.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Live Courses</CardTitle>
                            <Clock className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {masterclasses.filter(m => m.type === 'LIVE').length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Visible</CardTitle>
                            <Users className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {masterclasses.filter(m => m.visibility === 'show').length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Recorded Courses</CardTitle>
                            <DollarSign className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {masterclasses.filter(m => m.type === 'RECORDED').length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Masterclass List */}
                <div className="space-y-4">
                    {masterclasses.map((masterclass) => (
                        <Card key={masterclass._id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-xl font-semibold">{masterclass.title}</h3>
                                            <Badge variant="outline">{masterclass.type}</Badge>
                                            <Badge className={masterclass.visibility === 'show' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                                {masterclass.visibility === 'show' ? 'Visible' : 'Hidden'}
                                            </Badge>
                                            <Badge className={masterclass.status === 'Available' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}>
                                                {masterclass.status || 'Status N/A'}
                                            </Badge>
                                        </div>

                                        <p className="text-muted-foreground line-clamp-2">
                                            {masterclass.description}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                            {masterclass.startDate && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {formatDate(masterclass.startDate)}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4" />
                                                {masterclass.type === 'LIVE' ? 'Online Live' : 'Recorded'}
                                            </div>
                                            <div className="flex items-center gap-1 font-semibold">
                                                ₹{masterclass.price.toLocaleString()}
                                                {masterclass.originalPrice && (
                                                    <span className="line-through text-muted-foreground font-normal ml-1">₹{masterclass.originalPrice.toLocaleString()}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                            {masterclass.category && <span>📂 {masterclass.category.name}</span>}
                                            {masterclass.maxSeats && (
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-4 w-4" />
                                                    {masterclass.seatsSold ?? 0}/{masterclass.maxSeats} seats
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(masterclass)}
                                            className="flex items-center gap-2"
                                        >
                                            <Edit className="h-4 w-4" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2"
                                        >
                                            <Eye className="h-4 w-4" />
                                            View Dashboard
                                        </Button>
                                        {masterclass.status === "Coming Soon" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fetchWaitlist(masterclass.id || masterclass._id, masterclass.title)}
                                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                                            >
                                                <ListChecks className="h-4 w-4" />
                                                Waitlist
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {masterclasses.length === 0 && (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">No masterclasses yet</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    Get started by creating your first masterclass
                                </p>
                                <Button onClick={handleCreate} className="flex cursor-pointer items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create Your First Masterclass
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Waitlist Dialog */}
            <Dialog open={isWaitlistModalOpen} onOpenChange={setIsWaitlistModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader className="flex flex-row items-start justify-between">
                        <div>
                            <DialogTitle>Waitlist: {selectedMasterclassName}</DialogTitle>
                            <DialogDescription>
                                {waitlistUsers.length} user(s) are currently on the waitlist.
                            </DialogDescription>
                        </div>
                        {waitlistUsers.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={exportWaitlistCsv}
                                className="flex items-center gap-2 mt-0"
                            >
                                <Download className="h-4 w-4" />
                                Export CSV
                            </Button>
                        )}
                    </DialogHeader>

                    <div className="mt-4">
                        {isLoadingWaitlist ? (
                            <div className="py-8 text-center text-muted-foreground">Loading waitlist data...</div>
                        ) : waitlistUsers.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">No users on the waitlist yet.</div>
                        ) : (
                            <div className="border rounded-md">
                                <div className="grid grid-cols-3 bg-muted p-3 text-sm font-medium rounded-t-md">
                                    <div className="col-span-1">Email</div>
                                    <div className="col-span-1 text-center">Status</div>
                                    <div className="col-span-1 text-right">Joined At</div>
                                </div>
                                <ScrollArea className="h-[300px]">
                                    {waitlistUsers.map((user) => (
                                        <div key={user.id} className="grid grid-cols-3 p-3 text-sm border-t items-center">
                                            <div className="col-span-1 font-medium truncate pr-2" title={user.email}>
                                                {user.email}
                                            </div>
                                            <div className="col-span-1 text-center">
                                                <Badge variant="outline" className={user.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}>
                                                    {user.status}
                                                </Badge>
                                            </div>
                                            <div className="col-span-1 text-right text-muted-foreground whitespace-nowrap">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </ScrollArea>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MasterclassManagement;