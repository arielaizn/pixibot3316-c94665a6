import { useState } from 'react';
import { useVideoEditor } from '@/hooks/useVideoEditor';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Droplets, Sun, Contrast, Palette, Zap, Check, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Effect {
  id: string;
  type: 'filter' | 'transition';
  name: string;
  properties: Record<string, number>;
}

const FILTER_PRESETS = [
  { name: 'טשטוש', icon: Droplets, property: 'blur', default: 0, max: 20, unit: 'px' },
  { name: 'בהירות', icon: Sun, property: 'brightness', default: 100, max: 200, unit: '%' },
  { name: 'ניגודיות', icon: Contrast, property: 'contrast', default: 100, max: 200, unit: '%' },
  { name: 'רוויה', icon: Palette, property: 'saturate', default: 100, max: 200, unit: '%' },
];

const TRANSITION_PRESETS = [
  { name: 'Fade In', nameHe: 'דעיכה פנימה', duration: 30, type: 'fadeIn' },
  { name: 'Fade Out', nameHe: 'דעיכה החוצה', duration: 30, type: 'fadeOut' },
  { name: 'Slide In', nameHe: 'החלקה פנימה', duration: 30, type: 'slideIn' },
  { name: 'Zoom In', nameHe: 'זום פנימה', duration: 30, type: 'zoomIn' },
];

export const EffectsPanel = () => {
  const { composition, selectedClipId, updateClip } = useVideoEditor();
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    blur: 0,
    brightness: 100,
    contrast: 100,
    saturate: 100,
  });

  const selectedClip = composition.clips.find((c) => c.id === selectedClipId);

  const applyFilter = () => {
    if (!selectedClip) return;

    updateClip(selectedClip.id, {
      ...selectedClip,
      effects: {
        ...selectedClip.effects,
        filters,
      },
    });

    toast({
      title: "✨ פילטרים הוחלו",
      description: "האפקטים נשמרו בהצלחה",
    });
  };

  const resetFilters = () => {
    setFilters({
      blur: 0,
      brightness: 100,
      contrast: 100,
      saturate: 100,
    });
  };

  const applyTransition = (transition: typeof TRANSITION_PRESETS[0]) => {
    if (!selectedClip) return;

    updateClip(selectedClip.id, {
      ...selectedClip,
      effects: {
        ...selectedClip.effects,
        transition: {
          type: transition.type,
          duration: transition.duration,
        },
      },
    });

    toast({
      title: `🎬 ${transition.nameHe}`,
      description: "המעבר נוסף לקליפ",
    });
  };

  if (!selectedClip) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-lg font-bold mb-2">לא נבחר קליפ</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          בחר קליפ כדי להחיל אפקטים
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-primary" />
          <h3 className="font-bold">אפקטים</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          פילטרים ומעברים
        </p>
      </div>

      <Tabs defaultValue="filters" className="flex-1 flex flex-col min-h-0">
        <TabsList className="flex-shrink-0 w-full grid grid-cols-2 m-4 mb-0">
          <TabsTrigger value="filters" className="text-xs">פילטרים</TabsTrigger>
          <TabsTrigger value="transitions" className="text-xs">מעברים</TabsTrigger>
        </TabsList>

        {/* Filters Tab */}
        <TabsContent value="filters" className="flex-1 overflow-y-auto p-4 space-y-6 m-0">
          {FILTER_PRESETS.map((preset) => (
            <div key={preset.property} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <preset.icon className="w-4 h-4 text-primary" />
                  <Label className="text-sm font-semibold">{preset.name}</Label>
                </div>
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                  {filters[preset.property as keyof typeof filters]}{preset.unit}
                </span>
              </div>
              <Slider
                min={0}
                max={preset.max}
                step={1}
                value={[filters[preset.property as keyof typeof filters]]}
                onValueChange={(val) => setFilters({ ...filters, [preset.property]: val[0] })}
                className="w-full"
              />
            </div>
          ))}

          {/* Apply/Reset Buttons */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button onClick={applyFilter} variant="luxury" className="flex-1">
              <Check className="w-4 h-4 mr-2" />
              החל
            </Button>
            <Button onClick={resetFilters} variant="outline" className="flex-1">
              איפוס
            </Button>
          </div>

          {/* Filter Preview */}
          <div className="rounded-lg border border-primary/20 p-4 bg-primary/5">
            <p className="text-xs text-muted-foreground mb-2 font-semibold">תצוגה מקדימה של CSS:</p>
            <code className="text-xs bg-card/50 px-2 py-1 rounded block break-all font-mono">
              {`blur(${filters.blur}px) brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`}
            </code>
          </div>
        </TabsContent>

        {/* Transitions Tab */}
        <TabsContent value="transitions" className="flex-1 overflow-y-auto p-4 space-y-3 m-0">
          <p className="text-xs text-muted-foreground mb-4">
            בחר מעבר להחלה על הקליפ:
          </p>

          {TRANSITION_PRESETS.map((transition) => (
            <button
              key={transition.type}
              onClick={() => applyTransition(transition)}
              className="w-full p-4 rounded-lg border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-all text-right group relative overflow-hidden"
            >
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h4 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">
                    {transition.nameHe}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {transition.duration} פריימים ({(transition.duration / 30).toFixed(1)} שניות)
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}

          {/* Current Transition */}
          {selectedClip.effects?.transition && (
            <div className="mt-6 p-4 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5">
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">מעבר פעיל</h4>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs font-semibold">
                  {TRANSITION_PRESETS.find(t => t.type === selectedClip.effects.transition.type)?.nameHe}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {selectedClip.effects.transition.duration} פריימים
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
