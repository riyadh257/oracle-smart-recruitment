import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Type,
  Heading1,
  Image as ImageIcon,
  Square,
  Minus,
  MousePointer2,
  Trash2,
  GripVertical,
} from "lucide-react";

type BlockType = "header" | "text" | "button" | "image" | "spacer" | "divider";

interface TemplateBlock {
  id: number;
  templateId: number;
  blockType: BlockType;
  content?: string | null;
  imageUrl?: string | null;
  imageKey?: string | null;
  buttonUrl?: string | null;
  styles?: string | null;
  sortOrder: number;
}

interface BlockLibraryItem {
  type: BlockType;
  icon: React.ReactNode;
  label: string;
  defaultContent?: string;
  defaultStyles?: Record<string, string>;
}

const blockLibrary: BlockLibraryItem[] = [
  {
    type: "header",
    icon: <Heading1 className="h-5 w-5" />,
    label: "Header",
    defaultContent: "Header Text",
    defaultStyles: { fontSize: "24px", fontWeight: "bold", marginBottom: "16px" },
  },
  {
    type: "text",
    icon: <Type className="h-5 w-5" />,
    label: "Text",
    defaultContent: "Your text content here...",
    defaultStyles: { fontSize: "14px", lineHeight: "1.5", marginBottom: "12px" },
  },
  {
    type: "button",
    icon: <MousePointer2 className="h-5 w-5" />,
    label: "Button",
    defaultContent: "Click Here",
    defaultStyles: {
      backgroundColor: "#3b82f6",
      color: "#ffffff",
      padding: "12px 24px",
      borderRadius: "6px",
      textDecoration: "none",
      marginBottom: "16px",
    },
  },
  {
    type: "image",
    icon: <ImageIcon className="h-5 w-5" />,
    label: "Image",
    defaultStyles: { width: "100%", maxWidth: "600px", marginBottom: "16px" },
  },
  {
    type: "spacer",
    icon: <Square className="h-5 w-5" />,
    label: "Spacer",
    defaultStyles: { height: "40px" },
  },
  {
    type: "divider",
    icon: <Minus className="h-5 w-5" />,
    label: "Divider",
    defaultStyles: { border: "none", borderTop: "1px solid #e5e7eb", marginBottom: "16px" },
  },
];

function SortableBlock({
  block,
  onEdit,
  onDelete,
}: {
  block: TemplateBlock;
  onEdit: (block: TemplateBlock) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const styles = block.styles ? JSON.parse(block.styles) : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-2 flex items-center gap-3 hover:border-blue-400"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-500 uppercase">{block.blockType}</span>
        </div>
        <div className="text-sm">
          {block.blockType === "header" && <h3 style={styles}>{block.content}</h3>}
          {block.blockType === "text" && <p style={styles}>{block.content}</p>}
          {block.blockType === "button" && (
            <a href={block.buttonUrl || "#"} style={styles} className="inline-block">
              {block.content}
            </a>
          )}
          {block.blockType === "image" && block.imageUrl && (
            <img src={block.imageUrl} alt="" style={styles} className="max-h-32 object-contain" />
          )}
          {block.blockType === "spacer" && (
            <div style={styles} className="bg-gray-100 border-2 border-dashed border-gray-300" />
          )}
          {block.blockType === "divider" && <hr style={styles} />}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(block)}>
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={() => onDelete(block.id)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

export default function TemplateEditor({ templateId }: { templateId: number }) {
  const [blocks, setBlocks] = useState<TemplateBlock[]>([]);
  const [editingBlock, setEditingBlock] = useState<TemplateBlock | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: blocksData, refetch } = trpc.templateEditor.getBlocks.useQuery({ templateId });
  const createBlockMutation = trpc.templateEditor.createBlock.useMutation();
  const updateBlockMutation = trpc.templateEditor.updateBlock.useMutation();
  const deleteBlockMutation = trpc.templateEditor.deleteBlock.useMutation();
  const reorderBlocksMutation = trpc.templateEditor.reorderBlocks.useMutation();
  const uploadImageMutation = trpc.templateEditor.uploadImage.useMutation();
  const { data: htmlData, refetch: refetchHtml } = trpc.templateEditor.generateHtml.useQuery(
    { templateId },
    { enabled: false }
  );

  useEffect(() => {
    if (blocksData) {
      setBlocks(blocksData as TemplateBlock[]);
    }
  }, [blocksData]);

  useEffect(() => {
    if (htmlData) {
      setPreviewHtml(htmlData.html);
    }
  }, [htmlData]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);

      const newBlocks = arrayMove(blocks, oldIndex, newIndex);
      setBlocks(newBlocks);

      const updates = newBlocks.map((block, index) => ({
        id: block.id,
        sortOrder: index,
      }));

      await reorderBlocksMutation.mutateAsync({ updates });
      toast.success("Blocks reordered");
    }
  };

  const handleAddBlock = async (type: BlockType) => {
    const libraryItem = blockLibrary.find((item) => item.type === type);
    const newSortOrder = blocks.length;

    await createBlockMutation.mutateAsync({
      templateId,
      blockType: type,
      content: libraryItem?.defaultContent,
      styles: JSON.stringify(libraryItem?.defaultStyles || {}),
      sortOrder: newSortOrder,
    });

    refetch();
    toast.success("Block added");
  };

  const handleUpdateBlock = async () => {
    if (!editingBlock) return;

    await updateBlockMutation.mutateAsync({
      id: editingBlock.id,
      content: editingBlock.content || undefined,
      imageUrl: editingBlock.imageUrl || undefined,
      imageKey: editingBlock.imageKey || undefined,
      buttonUrl: editingBlock.buttonUrl || undefined,
      styles: editingBlock.styles || undefined,
    });

    refetch();
    setEditingBlock(null);
    toast.success("Block updated");
  };

  const handleDeleteBlock = async (id: number) => {
    await deleteBlockMutation.mutateAsync({ id });
    refetch();
    toast.success("Block deleted");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingBlock || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      const base64 = reader.result?.toString().split(",")[1];
      if (!base64) return;

      const result = await uploadImageMutation.mutateAsync({
        fileName: file.name,
        fileData: base64,
        mimeType: file.type,
      });

      setEditingBlock({
        ...editingBlock,
        imageUrl: result.imageUrl,
        imageKey: result.imageKey,
      });

      toast.success("Image uploaded");
    };

    reader.readAsDataURL(file);
  };

  const handleGeneratePreview = async () => {
    await refetchHtml();
    toast.success("Preview generated");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Block Library */}
      <Card>
        <CardHeader>
          <CardTitle>Block Library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {blockLibrary.map((item) => (
            <Button
              key={item.type}
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleAddBlock(item.type)}
            >
              {item.icon}
              <span className="ml-2">{item.label}</span>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Template Canvas</CardTitle>
        </CardHeader>
        <CardContent>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No blocks yet. Add blocks from the library to get started.</p>
                </div>
              ) : (
                blocks.map((block) => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    onEdit={setEditingBlock}
                    onDelete={handleDeleteBlock}
                  />
                ))
              )}
            </SortableContext>
          </DndContext>

          <div className="mt-6 flex gap-2">
            <Button onClick={handleGeneratePreview}>Generate Preview</Button>
          </div>
        </CardContent>
      </Card>

      {/* Editor Panel */}
      {editingBlock && (
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Edit Block</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="styles">Styles</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                {(editingBlock.blockType === "header" || editingBlock.blockType === "text") && (
                  <div>
                    <Label>Content</Label>
                    <Textarea
                      value={editingBlock.content || ""}
                      onChange={(e) =>
                        setEditingBlock({ ...editingBlock, content: e.target.value })
                      }
                    />
                  </div>
                )}

                {editingBlock.blockType === "button" && (
                  <>
                    <div>
                      <Label>Button Text</Label>
                      <Input
                        value={editingBlock.content || ""}
                        onChange={(e) =>
                          setEditingBlock({ ...editingBlock, content: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Button URL</Label>
                      <Input
                        value={editingBlock.buttonUrl || ""}
                        onChange={(e) =>
                          setEditingBlock({ ...editingBlock, buttonUrl: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}

                {editingBlock.blockType === "image" && (
                  <div>
                    <Label>Image</Label>
                    <Input type="file" accept="image/*" onChange={handleImageUpload} />
                    {editingBlock.imageUrl && (
                      <img
                        src={editingBlock.imageUrl}
                        alt="Preview"
                        className="mt-2 max-h-48 object-contain"
                      />
                    )}
                  </div>
                )}

                <Button onClick={handleUpdateBlock}>Save Changes</Button>
              </TabsContent>

              <TabsContent value="styles" className="space-y-4">
                <div>
                  <Label>Styles (JSON)</Label>
                  <Textarea
                    value={editingBlock.styles || "{}"}
                    onChange={(e) => setEditingBlock({ ...editingBlock, styles: e.target.value })}
                    rows={10}
                  />
                </div>
                <Button onClick={handleUpdateBlock}>Save Changes</Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {previewHtml && (
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-gray-50">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-96 border-0"
                title="Email Preview"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
