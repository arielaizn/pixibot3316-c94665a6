import { useState, useEffect } from 'react';
import { useImport } from '../hooks/useImport';

interface Project {
  id: string;
  name: string;
  created_at: string;
  storage_path: string | null;
  files: any[];
  videos: any[];
}

export default function ProjectBrowser() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { importProject, importing, progress } = useImport();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('pixibot_session') || '{}');
      const response = await fetch(
        'https://ymhcczxxrgcnyxaqmohj.supabase.co/functions/v1/pixi-plugin-projects',
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (project: Project) => {
    setError('');

    const result = await importProject(project.id, project);

    if (result.success) {
      alert(`✅ Project "${project.name}" imported successfully!`);
    } else {
      setError(result.error || 'Import failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Your Projects</h2>
        <p className="text-sm text-muted-foreground">Import projects from Pixibot</p>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No projects found
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="p-4 bg-muted border border-border rounded-lg hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{project.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {project.storage_path
                      ? 'Full project with assets'
                      : `${project.files.length} files \u2022 ${project.videos.length} videos`
                    }
                  </p>
                </div>
                <button
                  onClick={() => handleImport(project)}
                  disabled={importing}
                  className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {importing ? `${Math.round(progress)}%` : 'Import'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
