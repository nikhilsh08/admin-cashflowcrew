import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Plus, Search, Edit2, Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

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
    authorId: string;
    author?: {
        name: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

const BlogsManagement: React.FC = () => {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Delete dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchBlogs = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/admin/blogs`, { withCredentials: true });
            if (response.data.success) {
                setBlogs(response.data.blogs);
                setFilteredBlogs(response.data.blogs);
            }
        } catch (error) {
            console.error('Error fetching blogs:', error);
            toast.error('Failed to fetch blogs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBlogs();
    }, [fetchBlogs]);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredBlogs(blogs);
        } else {
            const lowercasedTerm = searchTerm.toLowerCase();
            const filtered = blogs.filter(blog =>
                blog.title.toLowerCase().includes(lowercasedTerm) ||
                blog.slug.toLowerCase().includes(lowercasedTerm) ||
                (blog.author?.name || '').toLowerCase().includes(lowercasedTerm)
            );
            setFilteredBlogs(filtered);
        }
    }, [searchTerm, blogs]);

    const handleDelete = async () => {
        if (!selectedBlog) return;
        try {
            setDeleting(true);
            const response = await axios.delete(
                `${import.meta.env.VITE_SERVER_URL}/api/admin/blogs/${selectedBlog.id}`,
                { withCredentials: true }
            );
            if (response.data.success) {
                toast.success('Blog deleted successfully');
                fetchBlogs();
                setIsDeleteDialogOpen(false);
                setSelectedBlog(null);
            }
        } catch (error: any) {
            console.error('Error deleting blog:', error);
            toast.error(error.response?.data?.message || 'Failed to delete blog');
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Blogs Management</h2>
                <Button onClick={() => navigate('/admin/blogs/new')} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Blog
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                        <CardTitle>All Blog Posts ({filteredBlogs.length})</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                type="text"
                                placeholder="Search blogs..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    ) : filteredBlogs.length === 0 ? (
                        <div className="text-center py-16">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No blogs found</h3>
                            <p className="text-gray-500 mb-4">
                                {searchTerm ? 'Try adjusting your search query' : 'Get started by creating a new blog post'}
                            </p>
                            {!searchTerm && (
                                <Button onClick={() => navigate('/admin/blogs/new')} className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Your First Blog
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead>Title</TableHead>
                                        <TableHead>Author</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Tags</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBlogs.map(blog => (
                                        <TableRow key={blog.id} className="hover:bg-gray-50">
                                            <TableCell>
                                                <div className="font-medium text-gray-900 line-clamp-1">{blog.title}</div>
                                                <div className="text-sm text-gray-500 truncate max-w-[200px]">/blogs/{blog.slug}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{blog.author?.name || 'Admin'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={blog.isPublished ? 'default' : 'secondary'}
                                                    className={blog.isPublished ? 'bg-green-100 text-green-800' : ''}
                                                >
                                                    {blog.isPublished ? 'Published' : 'Draft'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                    {blog.tags?.slice(0, 2).map((tag, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs bg-gray-50">{tag}</Badge>
                                                    ))}
                                                    {blog.tags?.length > 2 && (
                                                        <Badge variant="outline" className="text-xs">+{blog.tags.length - 2}</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {formatDate(blog.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/admin/blogs/edit/${blog.id}`)}
                                                        title="Edit blog"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-blue-600" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => { setSelectedBlog(blog); setIsDeleteDialogOpen(true); }}
                                                        title="Delete blog"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>"{selectedBlog?.title}"</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BlogsManagement;
