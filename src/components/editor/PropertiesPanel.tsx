import { useVideoEditor } from '@/hooks/useVideoEditor';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Box, Move, RotateCw, Maximize2, Sparkles, Clock } from 'lucide-react';

export const PropertiesPanel = () => {
  const { composition, selectedClipId, updateClip, scaleClip, rotateClip, moveClip } = useVideoEditor();

  const selectedClip = composition.clips.find((c) => c.id === selectedClipId);

  if (!selectedClip) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
          <Box className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-lg font-bold mb-2">לא נבחר קליפ</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          בחר קליפ מה-timeline כדי לערוך את המאפיינים שלו
        </p>
      </div>
    );
  }

  const transform = selectedClip.transform || {};

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-bold">מאפיינים</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          קליפ: {selectedClip.id.slice(0, 8)}...
        </p>
      </div>

      {/* Properties Tabs */}
      <Tabs defaultValue="transform" className="flex-1 flex flex-col min-h-0">
        <TabsList className="flex-shrink-0 w-full grid grid-cols-2 m-4 mb-0">
          <TabsTrigger value="transform" className="text-xs">טרנספורם</TabsTrigger>
          <TabsTrigger value="timing" className="text-xs">זמנים</TabsTrigger>
        </TabsList>

        {/* Transform Tab */}
        <TabsContent value="transform" className="flex-1 overflow-y-auto p-4 space-y-6 m-0">
          {/* Position */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4 text-primary" />
              <Label className="text-sm font-semibold">מיקום</Label>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="pos-x" className="text-xs text-muted-foreground mb-2 block">
                  היסט X
                </Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="pos-x"
                    min={-500}
                    max={500}
                    step={1}
                    value={[transform.x || 0]}
                    onValueChange={(val) => moveClip(selectedClip.id, val[0], transform.y || 0)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={transform.x || 0}
                    onChange={(e) => moveClip(selectedClip.id, parseInt(e.target.value) || 0, transform.y || 0)}
                    className="w-20 h-9 text-sm text-center"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pos-y" className="text-xs text-muted-foreground mb-2 block">
                  היסט Y
                </Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="pos-y"
                    min={-500}
                    max={500}
                    step={1}
                    value={[transform.y || 0]}
                    onValueChange={(val) => moveClip(selectedClip.id, transform.x || 0, val[0])}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={transform.y || 0}
                    onChange={(e) => moveClip(selectedClip.id, transform.x || 0, parseInt(e.target.value) || 0)}
                    className="w-20 h-9 text-sm text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Scale */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-primary" />
              <Label className="text-sm font-semibold">גודל</Label>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                min={0.1}
                max={3}
                step={0.1}
                value={[transform.scale || 1]}
                onValueChange={(val) => scaleClip(selectedClip.id, val[0])}
                className="flex-1"
              />
              <Input
                type="number"
                value={(transform.scale || 1).toFixed(1)}
                onChange={(e) => scaleClip(selectedClip.id, parseFloat(e.target.value) || 1)}
                className="w-20 h-9 text-sm text-center"
                step="0.1"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center font-semibold">
              {Math.round((transform.scale || 1) * 100)}%
            </p>
          </div>

          {/* Rotation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-primary" />
              <Label className="text-sm font-semibold">סיבוב</Label>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                min={0}
                max={360}
                step={1}
                value={[transform.rotate || 0]}
                onValueChange={(val) => rotateClip(selectedClip.id, val[0])}
                className="flex-1"
              />
              <Input
                type="number"
                value={transform.rotate || 0}
                onChange={(e) => rotateClip(selectedClip.id, parseInt(e.target.value) || 0)}
                className="w-20 h-9 text-sm text-center"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0, 90, 180, 270].map((deg) => (
                <Button
                  key={deg}
                  variant={transform.rotate === deg ? "default" : "outline"}
                  size="sm"
                  onClick={() => rotateClip(selectedClip.id, deg)}
                  className="text-xs h-8"
                >
                  {deg}°
                </Button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            onClick={() => updateClip(selectedClip.id, { transform: { x: 0, y: 0, scale: 1, rotate: 0 } })}
            className="w-full"
          >
            איפוס טרנספורם
          </Button>
        </TabsContent>

        {/* Timing Tab */}
        <TabsContent value="timing" className="flex-1 overflow-y-auto p-4 space-y-6 m-0">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-primary" />
              <Label className="text-sm font-semibold">תזמון</Label>
            </div>

            <div>
              <Label htmlFor="clip-start" className="text-sm font-semibold mb-3 block">
                פריים התחלה
              </Label>
              <Input
                id="clip-start"
                type="number"
                value={selectedClip.start}
                onChange={(e) => updateClip(selectedClip.id, { start: parseInt(e.target.value) || 0 })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-2">
                ⏱️ {(selectedClip.start / 30).toFixed(2)} שניות @ 30fps
              </p>
            </div>

            <div>
              <Label htmlFor="clip-duration" className="text-sm font-semibold mb-3 block">
                משך (פריימים)
              </Label>
              <Input
                id="clip-duration"
                type="number"
                value={selectedClip.duration}
                onChange={(e) => updateClip(selectedClip.id, { duration: parseInt(e.target.value) || 0 })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-2">
                ⏱️ {(selectedClip.duration / 30).toFixed(2)} שניות @ 30fps
              </p>
            </div>

            {/* Quick Time Presets */}
            <div className="pt-4 border-t border-border">
              <Label className="text-xs text-muted-foreground mb-2 block">קיצורי זמן מהירים</Label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 10].map((seconds) => (
                  <Button
                    key={seconds}
                    variant="outline"
                    size="sm"
                    onClick={() => updateClip(selectedClip.id, { duration: seconds * 30 })}
                    className="text-xs"
                  >
                    {seconds}s
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
