import { useState, useRef } from 'react';
import { useProjects } from '@/hooks/useProjects';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Loader2, Film, Upload, Check, HardDrive, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (videoUrl: string, duration: number) => void;
}

export const ImportVideoDialog = ({ open, onClose, onImport }: Props) => {
  const { projects, isLoading } = useProjects();
  const { toast } = useToast();
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allVideos = projects?.flatMap((project) => project.videos) || [];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's a video file
    if (!file.type.startsWith('video/')) {
      toast({
        title: "❌ קובץ לא תקין",
        description: "אנא בחר קובץ וידאו",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setUploadPreview(url);
    setSelectedVideo(null); // Clear project video selection
  };

  const handleImportFromProjects = async () => {
    if (!selectedVideo) return;

    setIsImporting(true);
    try {
      // TODO: Get actual video duration from metadata
      onImport(selectedVideo, 300); // Default 10s for now

      toast({
        title: "✅ וידאו יובא בהצלחה",
        description: "הוידאו נוסף ל-timeline",
      });

      onClose();
      setSelectedVideo(null);
      setUploadedFile(null);
      setUploadPreview(null);
    } catch (error) {
      toast({
        title: "❌ שגיאה בייבוא",
        description: "לא ניתן לייבא את הוידאו",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFromUpload = async () => {
    if (!uploadedFile || !uploadPreview) return;

    setIsImporting(true);
    try {
      // Use the local file URL
      onImport(uploadPreview, 300); // Default 10s for now

      toast({
        title: "✅ וידאו הועלה בהצלחה",
        description: "הוידאו נוסף ל-timeline",
      });

      onClose();
      setSelectedVideo(null);
      setUploadedFile(null);
      setUploadPreview(null);
    } catch (error) {
      toast({
        title: "❌ שגיאה בהעלאה",
        description: "לא ניתן להעלות את הוידאו",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleImport = () => {
    if (uploadedFile && uploadPreview) {
      handleImportFromUpload();
    } else if (selectedVideo) {
      handleImportFromProjects();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">ייבוא וידאו</DialogTitle>
              <DialogDescription className="text-sm">
                בחר וידאו מהפרויקטים או העלה מהמחשב
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs defaultValue="projects" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="projects" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              מהפרויקטים
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <HardDrive className="w-4 h-4" />
              מהמחשב
            </TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="flex-1 overflow-y-auto m-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">טוען פרויקטים...</p>
            </div>
          ) : allVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center">
                <Film className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-2">אין וידאו זמין</h3>
              <p className="text-sm text-muted-foreground max-w-xs text-center">
                צור וידאו בעמוד הפרויקטים כדי לייבא לעורך
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {allVideos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => setSelectedVideo(video.video_url)}
                  className={`relative aspect-video rounded-luxury-lg overflow-hidden border-2 transition-all duration-200 group ${
                    selectedVideo === video.video_url
                      ? 'border-primary shadow-luxury-lg scale-105 ring-4 ring-primary/20'
                      : 'border-border/50 hover:border-primary/50 hover:shadow-lg'
                  }`}
                >
                  <img
                    src={video.thumbnail_url}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />

                  {/* Overlay */}
                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
                    selectedVideo === video.video_url
                      ? 'bg-primary/30 backdrop-blur-sm'
                      : 'bg-black/40 opacity-0 group-hover:opacity-100'
                  }`}>
                    {selectedVideo === video.video_url ? (
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary shadow-lg">
                        <Check className="w-6 h-6 text-primary-foreground" />
                      </div>
                    ) : (
                      <Play className="w-10 h-10 text-white" />
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-xs text-white font-semibold truncate">
                      {video.version_number ? `גרסה ${video.version_number}` : 'וידאו'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="flex-1 overflow-y-auto m-0">
            <div className="flex flex-col items-center justify-center py-16">
              {!uploadPreview ? (
                <>
                  <div className="w-32 h-32 mb-6 rounded-luxury-lg bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-dashed border-primary/30 flex items-center justify-center">
                    <HardDrive className="w-16 h-16 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">העלה וידאו מהמחשב</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md text-center">
                    בחר קובץ וידאו מהמחשב שלך להעלאה ישירה לעורך
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="luxury"
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    בחר קובץ
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    תומך ב-MP4, MOV, AVI, WebM ועוד
                  </p>
                </>
              ) : (
                <div className="w-full max-w-2xl">
                  <div className="relative aspect-video rounded-luxury-lg overflow-hidden border-2 border-primary shadow-luxury-lg mb-4">
                    <video
                      src={uploadPreview}
                      className="w-full h-full object-cover"
                      controls
                    />
                    <div className="absolute top-2 right-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/90 backdrop-blur-sm rounded-full text-white text-xs font-semibold">
                        <Check className="w-3 h-3" />
                        מוכן להעלאה
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                    <div>
                      <p className="font-semibold text-sm mb-1">{uploadedFile?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {uploadedFile && `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB`}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUploadedFile(null);
                        setUploadPreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      החלף קובץ
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {uploadedFile ? (
              '✓ קובץ מוכן להעלאה'
            ) : selectedVideo ? (
              '✓ וידאו נבחר'
            ) : (
              `${allVideos.length} וידאו זמינים`
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isImporting}>
              ביטול
            </Button>
            <Button
              variant="luxury"
              onClick={handleImport}
              disabled={(!selectedVideo && !uploadedFile) || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploadedFile ? 'מעלה...' : 'מייבא...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadedFile ? 'העלה לעורך' : 'ייבוא לעורך'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
