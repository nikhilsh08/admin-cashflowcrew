import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Edit, Save, X, ArrowLeft, Package, DollarSign, Layers, Tag, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import axios from "axios";
import { toast } from "sonner";

interface Bundle {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  originalPrice: number;
  courseIds: string[];
  features: string[];
  membershipDuration: number;
  isActive: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface Course {
  id: string;
  title: string;
  price: number;
  status?: string;
}

const BundleManagement = () => {
  const [view, setView] = useState<"list" | "form">("list");
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isPublished, setIsPublished] = useState<boolean>(true);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<Partial<Bundle>>({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      membershipDuration: 365,
    },
  });

  const watchPrice = watch("price");

  const getBundles = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/bundles`, { withCredentials: true });
      setBundles(res.data.bundles || []);
    } catch (error) {
      console.error("Error fetching bundles:", error);
      toast.error("Failed to fetch bundles");
    }
  };

  const getCourses = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/masterclass/all-classes`, { withCredentials: true });
      const courseList = res.data.courses || res.data.data || [];
      // Filter only "Available" courses - exclude "Coming Soon" courses
      const availableCourses = courseList.filter((c: any) => c.status === "Available");
      setCourses(availableCourses.map((c: any) => ({
        id: c.id || c._id,
        title: c.title,
        price: c.price,
        status: c.status
      })));
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  useEffect(() => {
    getBundles();
    getCourses();
  }, []);

  // Calculate original price from selected courses
  const calculatedOriginalPrice = courses
    .filter(c => selectedCourseIds.includes(c.id))
    .reduce((sum, c) => sum + c.price, 0);

  // Calculate savings
  const savings = calculatedOriginalPrice - (Number(watchPrice) || 0);
  const savingsPercent = calculatedOriginalPrice > 0
    ? Math.round((savings / calculatedOriginalPrice) * 100)
    : 0;

  const handleCreate = () => {
    setEditingBundle(null);
    setSelectedCourseIds([]);
    setFeatures([]);
    setIsActive(true);
    setIsPublished(true);
    reset({
      name: "",
      slug: "",
      description: "",
      price: 0,
      membershipDuration: 365,
    });
    setView("form");
  };

  const handleEdit = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setSelectedCourseIds(bundle.courseIds);
    setFeatures(bundle.features);
    setIsActive(bundle.isActive);
    setIsPublished(bundle.isPublished);
    reset(bundle);
    setView("form");
  };

  const onSubmit = async (data: Partial<Bundle>) => {
    if (selectedCourseIds.length === 0) {
      toast.error("Please select at least one course");
      return;
    }

    if (features.length === 0) {
      toast.error("Please add at least one feature");
      return;
    }

    // Auto-generate slug from name if not provided
    const generatedSlug = data.slug?.trim() ||
      data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '';

    const submitData = {
      ...data,
      slug: generatedSlug,
      courseIds: selectedCourseIds,
      features,
      originalPrice: calculatedOriginalPrice,
      price: Number(data.price),
      membershipDuration: Number(data.membershipDuration) || 365,
      isActive,
      isPublished,
    };

    try {
      if (editingBundle) {
        await axios.patch(
          `${import.meta.env.VITE_SERVER_URL}/api/admin/bundles/${editingBundle.id}`,
          submitData,
          { withCredentials: true }
        );
        toast.success("Bundle updated successfully!");
      } else {
        await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/api/admin/bundles`,
          submitData,
          { withCredentials: true }
        );
        toast.success("Bundle created successfully!");
      }
      getBundles();
      setView("list");
    } catch (error: any) {
      console.error("Error saving bundle:", error);
      const errorMessage = error.response?.data?.error || "Failed to save bundle";
      toast.error(errorMessage);
    }
  };

  const handleToggle = async (bundle: Bundle) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_SERVER_URL}/api/admin/bundles/${bundle.id}`,
        { isActive: !bundle.isActive },
        { withCredentials: true }
      );
      toast.success(`Bundle ${!bundle.isActive ? 'activated' : 'deactivated'} successfully!`);
      getBundles();
    } catch (error) {
      console.error("Error toggling bundle:", error);
      toast.error("Failed to toggle bundle status");
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const selectAllCourses = () => {
    setSelectedCourseIds(courses.map(c => c.id));
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
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
              {editingBundle ? "Edit Bundle" : "Create New Bundle"}
            </h1>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingBundle ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                Bundle Details
              </CardTitle>
              <CardDescription>
                {editingBundle
                  ? "Update the bundle information below"
                  : "Fill in the details to create a new course bundle"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name + Slug */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="py-1">Bundle Name *</Label>
                    <Input
                      {...register("name", { required: "Bundle name is required" })}
                      placeholder="e.g. Complete Finance Masterclass"
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                  </div>
                  <div>
                    <Label className="py-1">Slug (optional)</Label>
                    <Input
                      {...register("slug")}
                      placeholder="e.g. complete-bundle"
                      className="lowercase"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-generated from name if left empty</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label className="py-1">Description</Label>
                  <Textarea
                    {...register("description")}
                    rows={3}
                    placeholder="Brief description of what's included in this bundle"
                  />
                </div>

                {/* Price + Membership Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="py-1">Bundle Price (₹) *</Label>
                    <Input
                      type="number"
                      {...register("price", { required: "Price is required" })}
                      min="0"
                    />
                    {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
                    {calculatedOriginalPrice > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Original: ₹{calculatedOriginalPrice.toLocaleString('en-IN')} |
                        Savings: ₹{savings.toLocaleString('en-IN')} ({savingsPercent}% off)
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="py-1">Membership Duration (days)</Label>
                    <Input
                      type="number"
                      {...register("membershipDuration")}
                      placeholder="365"
                      min="1"
                    />
                  </div>
                </div>

                {/* Course Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Select Courses *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={selectAllCourses}>
                      Select All
                    </Button>
                  </div>
                  <div className="border rounded-md p-3 max-h-64 overflow-y-auto space-y-2">
                    {courses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No courses found.</p>
                    ) : (
                      courses.map(course => (
                        <div
                          key={course.id}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                            selectedCourseIds.includes(course.id)
                              ? 'bg-primary/10 border border-primary/30'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => toggleCourse(course.id)}
                        >
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedCourseIds.includes(course.id)}
                              onChange={() => toggleCourse(course.id)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm">{course.title}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">₹{course.price}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCourseIds.length} course(s) selected
                  </p>
                </div>

                {/* Features */}
                <div>
                  <Label className="py-1">Features *</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="e.g. All 12 courses, Biweekly updates"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                    />
                    <Button type="button" variant="outline" onClick={handleAddFeature}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1 py-1">
                        {feature}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-500"
                          onClick={() => handleRemoveFeature(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                  {features.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">Add features that will be displayed on the bundle card</p>
                  )}
                </div>

                {/* Switches */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                    <Label>Active</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                    <Label>Published</Label>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {editingBundle ? "Update Bundle" : "Create Bundle"}
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
            <h1 className="text-2xl md:text-3xl font-bold">Bundle Management</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage course bundles with special pricing
            </p>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Bundle
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bundles</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bundles.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bundles</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bundles.filter(b => b.isActive && b.isPublished).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses in Bundles</CardTitle>
              <Layers className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bundles.reduce((sum, b) => sum + b.courseIds.length, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Bundle Price</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bundles.length > 0
                  ? formatPrice(Math.round(bundles.reduce((sum, b) => sum + b.price, 0) / bundles.length))
                  : '₹0'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bundle List */}
        <div className="space-y-4">
          {bundles.map((bundle) => (
            <Card key={bundle.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold">{bundle.name}</h3>
                      <Badge className={bundle.isActive && bundle.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {bundle.isActive && bundle.isPublished ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">
                        {bundle.courseIds.length} Courses
                      </Badge>
                    </div>

                    {bundle.description && (
                      <p className="text-muted-foreground">{bundle.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{formatPrice(bundle.price)}</span>
                        <span className="text-muted-foreground line-through">
                          {formatPrice(bundle.originalPrice)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag className="h-4 w-4 text-blue-600" />
                        Save {Math.round(((bundle.originalPrice - bundle.price) / bundle.originalPrice) * 100)}%
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {bundle.features.slice(0, 4).map((feature, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {bundle.features.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{bundle.features.length - 4} more
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Created: {formatDate(bundle.createdAt)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(bundle)}
                      className="flex items-center gap-2"
                    >
                      {bundle.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(bundle)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {bundles.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No bundles yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Get started by creating your first course bundle
                </p>
                <Button onClick={handleCreate} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Bundle
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BundleManagement;
