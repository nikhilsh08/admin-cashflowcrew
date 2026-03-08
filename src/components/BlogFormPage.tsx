import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, Save, Eye, EyeOff, XCircle, Tag, Globe, FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import TiptapEditor from './TiptapEditor';
import AdminLayout from './AdminLayout';

interface Blog {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    thumbnail: string;
    isPublished: boolean;
    seoTitle: string;
    seoDesc: string;
    tags: string[];
}

const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

const BlogFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = Boolean(id);

    const [loading, setLoading] = useState(isEditing);
    const [submitting, setSubmitting] = useState(false);
    const [tagInput, setTagInput] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        thumbnail: '',
        isPublished: true,
        seoTitle: '',
        seoDesc: '',
        tags: [] as string[],
    });

    const fetchBlog = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/blogs/${id}`, { withCredentials: true });
            if (response.data.success || response.data.blog) {
                const blog: Blog = response.data.blog || response.data;
                setFormData({
                    title: blog.title,
                    slug: blog.slug,
                    content: blog.content,
                    excerpt: blog.excerpt || '',
                    thumbnail: blog.thumbnail || '',
                    isPublished: blog.isPublished,
                    seoTitle: blog.seoTitle || '',
                    seoDesc: blog.seoDesc || '',
                    tags: blog.tags || [],
                });
            }
        } catch (error) {
            console.error('Error fetching blog:', error);
            toast.error('Failed to fetch blog post');
            navigate('/admin/blogs');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        if (isEditing) fetchBlog();
    }, [isEditing, fetchBlog]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setFormData(prev => ({
            ...prev,
            title,
            // Auto-generate slug only if slug is still empty or was auto-generated
            slug: prev.slug === generateSlug(prev.title) || prev.slug === '' ? generateSlug(title) : prev.slug,
        }));
    };

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
            e.preventDefault();
            const newTag = tagInput.trim().replace(/,$/, '');
            if (newTag && !formData.tags.includes(newTag)) {
                setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
    };

    const handleSubmit = async (publishStatus?: boolean) => {
        if (!formData.title.trim() || !formData.slug.trim() || !formData.content.trim()) {
            toast.error('Title, Slug, and Content are required fields.');
            return;
        }

        const payload = {
            ...formData,
            ...(publishStatus !== undefined && { isPublished: publishStatus }),
        };

        try {
            setSubmitting(true);
            if (isEditing) {
                const response = await axios.put(
                    `${import.meta.env.VITE_SERVER_URL}/api/admin/blogs/${id}`,
                    payload,
                    { withCredentials: true }
                );
                if (response.data.success) {
                    toast.success('Blog updated successfully!');
                    navigate('/admin/blogs');
                }
            } else {
                const response = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/admin/blogs`,
                    payload,
                    { withCredentials: true }
                );
                if (response.data?.success || response.status === 201) {
                    toast.success('Blog created successfully!');
                    navigate('/admin/blogs');
                }
            }
        } catch (error: any) {
            console.error('Error saving blog:', error);
            toast.error(error.response?.data?.message || 'Failed to save blog');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title={isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}>
                <div className="max-w-5xl mx-auto space-y-6">
                    <Skeleton className="h-10 w-64" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-[600px] w-full" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title={isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}>
            <div className="max-w-5xl mx-auto space-y-6 pb-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/blogs')} className="gap-2 text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Blogs
                        </Button>
                        <div className="h-6 w-px bg-gray-300" />
                        <h1 className="text-2xl font-bold text-gray-800">
                            {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            onClick={() => handleSubmit(false)}
                            disabled={submitting}
                            className="gap-2"
                        >
                            <EyeOff className="w-4 h-4" />
                            Save as Draft
                        </Button>
                        <Button
                            onClick={() => handleSubmit(true)}
                            disabled={submitting}
                            className="gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                            {submitting ? (
                                'Saving...'
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {isEditing ? 'Update & Publish' : 'Publish Blog'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Left Column */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-base font-semibold">
                                Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={handleTitleChange}
                                placeholder="Enter a compelling blog title..."
                                className="text-lg h-12"
                            />
                        </div>

                        {/* Slug */}
                        <div className="space-y-2">
                            <Label htmlFor="slug" className="text-base font-semibold">
                                Slug (URL) <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 border rounded-md">
                                <span className="text-sm text-gray-500 flex-shrink-0">/blogs/</span>
                                <Input
                                    id="slug"
                                    value={formData.slug}
                                    onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                    placeholder="blog-post-slug"
                                    className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 flex-1"
                                />
                            </div>
                        </div>

                        {/* Excerpt */}
                        <div className="space-y-2">
                            <Label htmlFor="excerpt" className="text-base font-semibold">
                                Excerpt / Summary
                            </Label>
                            <Textarea
                                id="excerpt"
                                value={formData.excerpt}
                                onChange={e => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                                placeholder="Brief summary displayed in blog cards and previews..."
                                rows={3}
                                className="resize-none"
                            />
                            <p className="text-xs text-gray-400">{formData.excerpt.length} / 300 characters recommended</p>
                        </div>

                        {/* Rich Text Editor */}
                        <div className="space-y-2">
                            <Label className="text-base font-semibold">
                                Content <span className="text-red-500">*</span>
                            </Label>
                            <TiptapEditor
                                content={formData.content}
                                onChange={content => setFormData(prev => ({ ...prev, content }))}
                                placeholder="Start writing your amazing blog post here..."
                            />
                        </div>
                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="space-y-5">
                        {/* Publish Settings */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-blue-500" />
                                    Publish Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium">Status</p>
                                        <p className="text-xs text-gray-500">
                                            {formData.isPublished ? 'Visible to public' : 'Hidden from public'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={formData.isPublished ? 'default' : 'secondary'}
                                            className={formData.isPublished ? 'bg-green-100 text-green-800 text-xs' : 'text-xs'}>
                                            {formData.isPublished ? 'Published' : 'Draft'}
                                        </Badge>
                                        <Switch
                                            checked={formData.isPublished}
                                            onCheckedChange={checked => setFormData(prev => ({ ...prev, isPublished: checked }))}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Thumbnail */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-purple-500" />
                                    Featured Image
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="thumbnail" className="text-xs text-gray-600">Image URL</Label>
                                    <Input
                                        id="thumbnail"
                                        value={formData.thumbnail}
                                        onChange={e => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
                                        placeholder="https://example.com/image.jpg"
                                        className="text-sm"
                                    />
                                </div>
                                {formData.thumbnail ? (
                                    <div className="relative group">
                                        <img
                                            src={formData.thumbnail}
                                            alt="Thumbnail preview"
                                            className="w-full h-40 object-cover rounded-lg border"
                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                        <button
                                            onClick={() => setFormData(prev => ({ ...prev, thumbnail: '' }))}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <XCircle className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-gray-200 rounded-lg h-32 flex items-center justify-center text-gray-400 text-sm">
                                        Paste a URL above to preview
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Tags */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-orange-500" />
                                    Tags
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-1.5">
                                    <Input
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={handleAddTag}
                                        placeholder="Type and press Enter or comma..."
                                        className="text-sm"
                                    />
                                    <p className="text-xs text-gray-400">Press Enter or comma to add a tag</p>
                                </div>
                                {formData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.tags.map(tag => (
                                            <Badge key={tag} variant="secondary" className="flex items-center gap-1 text-xs">
                                                {tag}
                                                <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-red-500 ml-0.5">
                                                    <XCircle className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* SEO Settings */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-green-500" />
                                    SEO Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="seoTitle" className="text-xs text-gray-600">SEO Title</Label>
                                    <Input
                                        id="seoTitle"
                                        value={formData.seoTitle}
                                        onChange={e => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                                        placeholder="Title for search engines"
                                        className="text-sm"
                                    />
                                    <p className="text-xs text-gray-400">{formData.seoTitle.length} / 60 chars recommended</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="seoDesc" className="text-xs text-gray-600">SEO Description</Label>
                                    <Textarea
                                        id="seoDesc"
                                        value={formData.seoDesc}
                                        onChange={e => setFormData(prev => ({ ...prev, seoDesc: e.target.value }))}
                                        placeholder="Meta description for search results..."
                                        rows={4}
                                        className="text-sm resize-none"
                                    />
                                    <p className="text-xs text-gray-400">{formData.seoDesc.length} / 160 chars recommended</p>
                                </div>

                                {/* SEO Preview */}
                                {(formData.seoTitle || formData.seoDesc || formData.slug) && (
                                    <div className="border rounded-lg p-3 bg-white space-y-1">
                                        <p className="text-xs font-medium text-gray-500 mb-2">Preview in Google</p>
                                        <p className="text-blue-600 text-sm font-medium truncate">
                                            {formData.seoTitle || formData.title || 'Blog Post Title'}
                                        </p>
                                        <p className="text-green-700 text-xs truncate">
                                            yoursite.com/blogs/{formData.slug || 'blog-post-slug'}
                                        </p>
                                        <p className="text-gray-600 text-xs line-clamp-2">
                                            {formData.seoDesc || formData.excerpt || 'No description provided...'}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Bottom actions for mobile */}
                        <div className="flex flex-col gap-2 lg:hidden">
                            <Button
                                variant="outline"
                                onClick={() => handleSubmit(false)}
                                disabled={submitting}
                                className="w-full gap-2"
                            >
                                <EyeOff className="w-4 h-4" />
                                Save as Draft
                            </Button>
                            <Button
                                onClick={() => handleSubmit(true)}
                                disabled={submitting}
                                className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                            >
                                <Save className="w-4 h-4" />
                                {submitting ? 'Saving...' : (isEditing ? 'Update & Publish' : 'Publish Blog')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default BlogFormPage;
