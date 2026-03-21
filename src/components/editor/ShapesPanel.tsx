import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Square, Circle, Triangle, Star, Plus, Trash2, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'star';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  rotation: number;
  startFrame: number;
  endFrame: number;
}

const SHAPE_TYPES = [
  { type: 'rectangle' as const, icon: Square, name: 'מלבן' },
  { type: 'circle' as const, icon: Circle, name: 'עיגול' },
  { type: 'triangle' as const, icon: Triangle, name: 'משולש' },
  { type: 'star' as const, icon: Star, name: 'כוכב' },
];

export const ShapesPanel = () => {
  const { toast } = useToast();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  const addShape = (type: Shape['type']) => {
    const newShape: Shape = {
      id: Date.now().toString(),
      type,
      x: 960,
      y: 540,
      width: 200,
      height: 200,
      color: '#3b82f6',
      opacity: 1,
      rotation: 0,
      startFrame: 0,
      endFrame: 300,
    };
    setShapes([...shapes, newShape]);
    setSelectedShapeId(newShape.id);

    toast({
      title: "✨ צורה נוספה",
      description: `${SHAPE_TYPES.find(s => s.type === type)?.name} נוסף בהצלחה`,
    });
  };

  const removeShape = (id: string) => {
    setShapes(shapes.filter((s) => s.id !== id));
    if (selectedShapeId === id) {
      setSelectedShapeId(null);
    }

    toast({
      title: "🗑️ צורה נמחקה",
      description: "הצורה הוסרה בהצלחה",
    });
  };

  const updateShape = (id: string, updates: Partial<Shape>) => {
    setShapes(shapes.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const selectedShape = shapes.find((s) => s.id === selectedShapeId);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h3 className="font-bold">צורות ושכבות</h3>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          הוסף צורות גרפיות לוידאו שלך
        </p>
      </div>

      {/* Shape Types */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <Label className="text-xs text-muted-foreground mb-3 block">הוסף צורה:</Label>
        <div className="grid grid-cols-4 gap-2">
          {SHAPE_TYPES.map(({ type, icon: Icon, name }) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => addShape(type)}
              className="flex-col h-auto py-3 gap-1"
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Shapes List */}
      <div className="flex-shrink-0 p-4 border-b border-border space-y-2 max-h-48 overflow-y-auto">
        {shapes.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <Layers className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">אין צורות</p>
            <p className="text-xs text-muted-foreground">בחר צורה מהרשימה למעלה</p>
          </div>
        ) : (
          shapes.map((shape) => {
            const ShapeIcon = SHAPE_TYPES.find(s => s.type === shape.type)?.icon || Square;
            const shapeName = SHAPE_TYPES.find(s => s.type === shape.type)?.name || 'צורה';

            return (
              <button
                key={shape.id}
                onClick={() => setSelectedShapeId(shape.id)}
                className={`w-full p-3 rounded-lg border text-right transition-all group ${
                  selectedShapeId === shape.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:bg-muted/50 hover:border-primary/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center"
                      style={{ backgroundColor: shape.color }}
                    >
                      <ShapeIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{shapeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {shape.width}x{shape.height}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeShape(shape.id);
                    }}
                    className="p-1.5 hover:bg-destructive/10 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Shape Editor */}
      {selectedShape ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shape-x" className="text-xs text-muted-foreground mb-2 block">
                מיקום X
              </Label>
              <Input
                id="shape-x"
                type="number"
                value={selectedShape.x}
                onChange={(e) => updateShape(selectedShape.id, { x: parseInt(e.target.value) || 0 })}
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="shape-y" className="text-xs text-muted-foreground mb-2 block">
                מיקום Y
              </Label>
              <Input
                id="shape-y"
                type="number"
                value={selectedShape.y}
                onChange={(e) => updateShape(selectedShape.id, { y: parseInt(e.target.value) || 0 })}
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shape-w" className="text-xs text-muted-foreground mb-2 block">
                רוחב
              </Label>
              <Input
                id="shape-w"
                type="number"
                value={selectedShape.width}
                onChange={(e) => updateShape(selectedShape.id, { width: parseInt(e.target.value) || 0 })}
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="shape-h" className="text-xs text-muted-foreground mb-2 block">
                גובה
              </Label>
              <Input
                id="shape-h"
                type="number"
                value={selectedShape.height}
                onChange={(e) => updateShape(selectedShape.id, { height: parseInt(e.target.value) || 0 })}
                className="h-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="shape-color" className="text-xs text-muted-foreground mb-2 block">
              צבע
            </Label>
            <div className="flex gap-2">
              <Input
                id="shape-color"
                type="color"
                value={selectedShape.color}
                onChange={(e) => updateShape(selectedShape.id, { color: e.target.value })}
                className="h-9 w-16 cursor-pointer"
              />
              <Input
                type="text"
                value={selectedShape.color}
                onChange={(e) => updateShape(selectedShape.id, { color: e.target.value })}
                className="h-9 flex-1 font-mono"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="shape-opacity" className="text-xs text-muted-foreground mb-2 block">
              שקיפות
            </Label>
            <div className="flex items-center gap-2">
              <Slider
                id="shape-opacity"
                min={0}
                max={1}
                step={0.1}
                value={[selectedShape.opacity]}
                onValueChange={(val) => updateShape(selectedShape.id, { opacity: val[0] })}
                className="flex-1"
              />
              <span className="text-sm font-mono w-12 text-center">
                {Math.round(selectedShape.opacity * 100)}%
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="shape-rotation" className="text-xs text-muted-foreground mb-2 block">
              סיבוב
            </Label>
            <div className="flex items-center gap-2">
              <Slider
                id="shape-rotation"
                min={0}
                max={360}
                step={1}
                value={[selectedShape.rotation]}
                onValueChange={(val) => updateShape(selectedShape.id, { rotation: val[0] })}
                className="flex-1"
              />
              <span className="text-sm font-mono w-12 text-center">
                {selectedShape.rotation}°
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shape-start" className="text-xs text-muted-foreground mb-2 block">
                פריים התחלה
              </Label>
              <Input
                id="shape-start"
                type="number"
                value={selectedShape.startFrame}
                onChange={(e) => updateShape(selectedShape.id, { startFrame: parseInt(e.target.value) || 0 })}
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="shape-end" className="text-xs text-muted-foreground mb-2 block">
                פריים סיום
              </Label>
              <Input
                id="shape-end"
                type="number"
                value={selectedShape.endFrame}
                onChange={(e) => updateShape(selectedShape.id, { endFrame: parseInt(e.target.value) || 0 })}
                className="h-9"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <Layers className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              בחר צורה לעריכה
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
