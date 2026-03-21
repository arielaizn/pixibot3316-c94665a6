import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Type, Plus, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight: string;
  startFrame: number;
  endFrame: number;
}

export const TextOverlay = () => {
  const { toast } = useToast();
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  const addTextElement = () => {
    const newText: TextElement = {
      id: Date.now().toString(),
      text: 'טקסט חדש',
      x: 960,
      y: 540,
      fontSize: 48,
      color: '#ffffff',
      fontWeight: 'bold',
      startFrame: 0,
      endFrame: 300,
    };
    setTextElements([...textElements, newText]);
    setSelectedTextId(newText.id);

    toast({
      title: "📝 טקסט נוסף",
      description: "אלמנט טקסט חדש נוצר",
    });
  };

  const removeTextElement = (id: string) => {
    setTextElements(textElements.filter((t) => t.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }

    toast({
      title: "🗑️ טקסט נמחק",
      description: "האלמנט הוסר בהצלחה",
    });
  };

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(textElements.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const selectedText = textElements.find((t) => t.id === selectedTextId);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-primary" />
            <h3 className="font-bold">טקסט וכותרות</h3>
          </div>
          <Button size="sm" variant="luxury-outline" onClick={addTextElement}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          הוסף טקסט וכותרות לוידאו שלך
        </p>
      </div>

      {/* Text Elements List */}
      <div className="flex-shrink-0 p-4 border-b border-border space-y-2 max-h-48 overflow-y-auto">
        {textElements.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <Type className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">אין אלמנטי טקסט</p>
            <Button size="sm" variant="luxury-outline" onClick={addTextElement}>
              <Plus className="w-4 h-4 mr-2" />
              הוסף טקסט
            </Button>
          </div>
        ) : (
          textElements.map((text) => (
            <button
              key={text.id}
              onClick={() => setSelectedTextId(text.id)}
              className={`w-full p-3 rounded-lg border text-right transition-all group ${
                selectedTextId === text.id
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:bg-muted/50 hover:border-primary/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-2">
                  <p className="text-sm font-medium truncate">{text.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {text.fontSize}px • {text.color}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTextElement(text.id);
                  }}
                  className="p-1.5 hover:bg-destructive/10 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Text Editor */}
      {selectedText ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <Label htmlFor="text-content" className="text-sm font-semibold mb-2 block">
              תוכן הטקסט
            </Label>
            <Textarea
              id="text-content"
              value={selectedText.text}
              onChange={(e) => updateTextElement(selectedText.id, { text: e.target.value })}
              placeholder="הזן את הטקסט שלך..."
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="text-x" className="text-xs text-muted-foreground mb-2 block">
                מיקום X
              </Label>
              <Input
                id="text-x"
                type="number"
                value={selectedText.x}
                onChange={(e) => updateTextElement(selectedText.id, { x: parseInt(e.target.value) || 0 })}
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="text-y" className="text-xs text-muted-foreground mb-2 block">
                מיקום Y
              </Label>
              <Input
                id="text-y"
                type="number"
                value={selectedText.y}
                onChange={(e) => updateTextElement(selectedText.id, { y: parseInt(e.target.value) || 0 })}
                className="h-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="text-size" className="text-xs text-muted-foreground mb-2 block">
              גודל פונט
            </Label>
            <Input
              id="text-size"
              type="number"
              value={selectedText.fontSize}
              onChange={(e) => updateTextElement(selectedText.id, { fontSize: parseInt(e.target.value) || 12 })}
              className="h-9"
            />
          </div>

          <div>
            <Label htmlFor="text-color" className="text-xs text-muted-foreground mb-2 block">
              צבע
            </Label>
            <div className="flex gap-2">
              <Input
                id="text-color"
                type="color"
                value={selectedText.color}
                onChange={(e) => updateTextElement(selectedText.id, { color: e.target.value })}
                className="h-9 w-16 cursor-pointer"
              />
              <Input
                type="text"
                value={selectedText.color}
                onChange={(e) => updateTextElement(selectedText.id, { color: e.target.value })}
                className="h-9 flex-1 font-mono"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="text-weight" className="text-xs text-muted-foreground mb-2 block">
              משקל פונט
            </Label>
            <Select
              value={selectedText.fontWeight}
              onValueChange={(value) => updateTextElement(selectedText.id, { fontWeight: value })}
            >
              <SelectTrigger id="text-weight" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">רגיל</SelectItem>
                <SelectItem value="bold">מודגש</SelectItem>
                <SelectItem value="600">חצי מודגש</SelectItem>
                <SelectItem value="300">דק</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="text-start" className="text-xs text-muted-foreground mb-2 block">
                פריים התחלה
              </Label>
              <Input
                id="text-start"
                type="number"
                value={selectedText.startFrame}
                onChange={(e) => updateTextElement(selectedText.id, { startFrame: parseInt(e.target.value) || 0 })}
                className="h-9"
              />
            </div>

            <div>
              <Label htmlFor="text-end" className="text-xs text-muted-foreground mb-2 block">
                פריים סיום
              </Label>
              <Input
                id="text-end"
                type="number"
                value={selectedText.endFrame}
                onChange={(e) => updateTextElement(selectedText.id, { endFrame: parseInt(e.target.value) || 0 })}
                className="h-9"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg border-2 border-primary/20 p-6 bg-gradient-to-br from-black to-gray-900 text-center">
            <div className="flex items-center gap-2 justify-center mb-3">
              <Eye className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">תצוגה מקדימה</span>
            </div>
            <p
              style={{
                fontSize: `${Math.min(selectedText.fontSize / 2, 32)}px`,
                color: selectedText.color,
                fontWeight: selectedText.fontWeight,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {selectedText.text || 'תצוגה מקדימה'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <Type className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              בחר אלמנט טקסט לעריכה
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
