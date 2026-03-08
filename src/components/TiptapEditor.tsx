import React, { useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { createLowlight } from 'lowlight';
import js from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript';
import css from 'highlight.js/lib/languages/css';
import html from 'highlight.js/lib/languages/xml';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Quote, Code, CodeSquare,
    Heading1, Heading2, Heading3, Heading4,
    Link as LinkIcon, Image as ImageIcon, Minus,
    Undo, Redo, Table as TableIcon, Subscript as SubscriptIcon,
    Superscript as SuperscriptIcon, Highlighter, Palette,
    RotateCcw, ChevronDown, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const lowlight = createLowlight();
lowlight.register('js', js);
lowlight.register('ts', ts);
lowlight.register('css', css);
lowlight.register('html', html);
lowlight.register('python', python);
lowlight.register('sql', sql);

interface TiptapEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

interface ToolbarButtonProps {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, active, disabled, title, children }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`p-1.5 rounded transition-colors ${active
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
        {children}
    </button>
);

const TiptapEditor: React.FC<TiptapEditorProps> = ({
    content,
    onChange,
    placeholder = 'Write your blog content here...',
}) => {
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [showImageInput, setShowImageInput] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [imageAlt, setImageAlt] = useState('');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showHighlightPicker, setShowHighlightPicker] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ codeBlock: false }),
            Underline,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer' } }),
            Image.configure({ inline: false, allowBase64: true, HTMLAttributes: { class: 'rounded-lg max-w-full mx-auto' } }),
            Placeholder.configure({ placeholder }),
            CharacterCount,
            CodeBlockLowlight.configure({ lowlight }),
            Table.configure({ resizable: true }),
            TableRow,
            TableCell,
            TableHeader,
            Subscript,
            Superscript,
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'min-h-[500px] outline-none prose prose-sm max-w-none px-6 py-4 focus:outline-none',
            },
        },
    });

    const addLink = useCallback(() => {
        if (!editor) return;
        if (!linkUrl.trim()) {
            editor.chain().focus().unsetLink().run();
        } else {
            const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
            editor.chain().focus().setLink({ href: url }).run();
        }
        setLinkUrl('');
        setShowLinkInput(false);
    }, [editor, linkUrl]);

    const addImage = useCallback(() => {
        if (!editor || !imageUrl.trim()) return;
        editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt || 'Image' }).run();
        setImageUrl('');
        setImageAlt('');
        setShowImageInput(false);
    }, [editor, imageUrl, imageAlt]);

    const colors = [
        '#000000', '#374151', '#EF4444', '#F97316', '#EAB308',
        '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6',
        '#FFFFFF', '#F1F5F9', '#FEE2E2', '#FEF3C7', '#DCFCE7',
        '#DBEAFE', '#EDE9FE', '#FCE7F3', '#CCFBF1', '#F0F9FF',
    ];

    const highlightColors = [
        '#FEF08A', '#BBF7D0', '#BAE6FD', '#DDD6FE', '#FBCFE8',
        '#FED7AA', '#F5F5F5', '#E5E7EB', '#FCA5A5', '#6EE7B7',
    ];

    if (!editor) return null;

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm flex flex-col" style={{ height: '600px' }}>
            {/* Sticky Toolbar */}
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 flex flex-wrap gap-0.5 items-center sticky top-0 z-10 overflow-x-auto">

                {/* History */}
                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
                    <Undo className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Shift+Z)">
                    <Redo className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Headings */}
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
                    <Heading1 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
                    <Heading2 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
                    <Heading3 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive('heading', { level: 4 })} title="Heading 4">
                    <Heading4 className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Basic formatting */}
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
                    <UnderlineIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
                    <Strikethrough className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript">
                    <SubscriptIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript">
                    <SuperscriptIcon className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Color */}
                <div className="relative">
                    <ToolbarButton onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); }} title="Text Color" active={showColorPicker}>
                        <div className="flex items-center gap-0.5">
                            <Palette className="w-4 h-4" />
                            <ChevronDown className="w-2.5 h-2.5" />
                        </div>
                    </ToolbarButton>
                    {showColorPicker && (
                        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 w-52">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-gray-600">Text Color</span>
                                <button onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                                    <RotateCcw className="w-3 h-3" /> Reset
                                </button>
                            </div>
                            <div className="grid grid-cols-10 gap-1">
                                {colors.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false); }}
                                        className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Highlight */}
                <div className="relative">
                    <ToolbarButton onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); }} title="Highlight" active={editor.isActive('highlight') || showHighlightPicker}>
                        <div className="flex items-center gap-0.5">
                            <Highlighter className="w-4 h-4" />
                            <ChevronDown className="w-2.5 h-2.5" />
                        </div>
                    </ToolbarButton>
                    {showHighlightPicker && (
                        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 w-44">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-gray-600">Highlight</span>
                                <button onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlightPicker(false); }} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                                    <RotateCcw className="w-3 h-3" /> Remove
                                </button>
                            </div>
                            <div className="grid grid-cols-5 gap-1">
                                {highlightColors.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => { editor.chain().focus().setHighlight({ color }).run(); setShowHighlightPicker(false); }}
                                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Alignment */}
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
                    <AlignLeft className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
                    <AlignCenter className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
                    <AlignRight className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
                    <AlignJustify className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Lists */}
                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Blocks */}
                <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
                    <Quote className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
                    <Code className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
                    <CodeSquare className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
                    <Minus className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Table */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    title="Insert Table"
                    active={editor.isActive('table')}
                >
                    <TableIcon className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Link */}
                <ToolbarButton onClick={() => { setShowLinkInput(!showLinkInput); setShowImageInput(false); }} active={editor.isActive('link') || showLinkInput} title="Insert Link">
                    <LinkIcon className="w-4 h-4" />
                </ToolbarButton>

                {/* Image */}
                <ToolbarButton onClick={() => { setShowImageInput(!showImageInput); setShowLinkInput(false); }} active={showImageInput} title="Insert Image via URL">
                    <ImageIcon className="w-4 h-4" />
                </ToolbarButton>
            </div>

            {/* Link Input Panel */}
            {showLinkInput && (
                <div className="border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-950 px-3 py-2 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <Input
                        type="url"
                        value={linkUrl}
                        onChange={e => setLinkUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="h-7 text-sm flex-1"
                        onKeyDown={e => e.key === 'Enter' && addLink()}
                        autoFocus
                    />
                    <Button size="sm" onClick={addLink} className="h-7 text-xs px-3 bg-blue-600 hover:bg-blue-700">
                        {editor.isActive('link') ? 'Update' : 'Set Link'}
                    </Button>
                    {editor.isActive('link') && (
                        <Button size="sm" variant="outline" onClick={() => { editor.chain().focus().unsetLink().run(); setShowLinkInput(false); }} className="h-7 text-xs px-2">
                            Remove
                        </Button>
                    )}
                    <button onClick={() => setShowLinkInput(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Image Input Panel */}
            {showImageInput && (
                <div className="border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-950 px-3 py-2 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">Insert Image from URL</span>
                        <button onClick={() => setShowImageInput(false)} className="ml-auto text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            type="url"
                            value={imageUrl}
                            onChange={e => setImageUrl(e.target.value)}
                            placeholder="Image URL: https://example.com/image.jpg"
                            className="h-7 text-sm flex-1"
                            onKeyDown={e => e.key === 'Enter' && addImage()}
                            autoFocus
                        />
                        <Input
                            type="text"
                            value={imageAlt}
                            onChange={e => setImageAlt(e.target.value)}
                            placeholder="Alt text (optional)"
                            className="h-7 text-sm w-44"
                        />
                        <Button size="sm" onClick={addImage} disabled={!imageUrl.trim()} className="h-7 text-xs px-3 bg-green-600 hover:bg-green-700">
                            Insert
                        </Button>
                    </div>
                </div>
            )}

            {/* Editor Content — scrollable */}
            <div className="relative flex-1 overflow-y-auto" onClick={() => editor.commands.focus()}>
                {editor && (
                    <BubbleMenu editor={editor}
                        className="flex items-center gap-1 bg-gray-900 text-white rounded-lg px-2 py-1 shadow-xl z-50">
                        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1 rounded text-xs font-bold ${editor.isActive('bold') ? 'bg-white/20' : 'hover:bg-white/10'}`}>B</button>
                        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1 rounded text-xs italic ${editor.isActive('italic') ? 'bg-white/20' : 'hover:bg-white/10'}`}>I</button>
                        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-1 rounded text-xs underline ${editor.isActive('underline') ? 'bg-white/20' : 'hover:bg-white/10'}`}>U</button>
                        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-1 rounded text-xs line-through ${editor.isActive('strike') ? 'bg-white/20' : 'hover:bg-white/10'}`}>S</button>
                        <div className="w-px h-4 bg-white/30 mx-0.5" />
                        <button onClick={() => { const prevUrl = editor.getAttributes('link').href || ''; setLinkUrl(prevUrl); setShowLinkInput(true); }} className={`p-1 rounded ${editor.isActive('link') ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                            <LinkIcon className="w-3 h-3" />
                        </button>
                    </BubbleMenu>
                )}
                <EditorContent editor={editor} />
            </div>

            {/* Footer — pinned at bottom */}
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-1.5 flex justify-between items-center text-xs text-gray-400">
                <span>{editor.storage.characterCount?.characters() ?? 0} characters</span>
                <span>{editor.storage.characterCount?.words() ?? 0} words</span>
            </div>

            <style>{`
                .tiptap {
                    outline: none;
                }
                .tiptap p.is-editor-empty:first-child::before {
                    color: #adb5bd;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
                .tiptap h1 { font-size: 2em; font-weight: 700; margin: 0.67em 0; }
                .tiptap h2 { font-size: 1.5em; font-weight: 700; margin: 0.75em 0; }
                .tiptap h3 { font-size: 1.17em; font-weight: 600; margin: 0.83em 0; }
                .tiptap h4 { font-size: 1em; font-weight: 600; margin: 1em 0; }
                .tiptap blockquote {
                    border-left: 4px solid #3B82F6;
                    padding-left: 1rem;
                    margin: 1rem 0;
                    color: #6B7280;
                    font-style: italic;
                }
                .tiptap ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
                .tiptap ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
                .tiptap code {
                    background: #F3F4F6;
                    border-radius: 0.25rem;
                    font-size: 0.875em;
                    padding: 0.125rem 0.375rem;
                    font-family: 'Courier New', monospace;
                }
                .tiptap pre {
                    background: #1E293B;
                    color: #E2E8F0;
                    border-radius: 0.5rem;
                    padding: 1rem;
                    overflow-x: auto;
                    margin: 1rem 0;
                }
                .tiptap pre code {
                    background: none;
                    padding: 0;
                    font-size: 0.875em;
                    color: inherit;
                }
                .tiptap hr { border: 1px solid #E5E7EB; margin: 1.5rem 0; }
                .tiptap a { color: #3B82F6; text-decoration: underline; cursor: pointer; }
                .tiptap a:hover { color: #1D4ED8; }
                .tiptap img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem auto; display: block; }
                .tiptap table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
                .tiptap table td, .tiptap table th { border: 1px solid #E5E7EB; padding: 0.5rem 0.75rem; text-align: left; }
                .tiptap table th { background: #F9FAFB; font-weight: 600; }
                .tiptap table tr:hover { background: #F9FAFB; }
                .tiptap mark { border-radius: 0.2rem; padding: 0.1rem 0.2rem; }
            `}</style>
        </div>
    );
};

export default TiptapEditor;
