// Backup of EditPage - restore when dependencies are installed
import { Link } from 'react-router-dom';

const EditPage = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Video Editor</h1>
        <p className="text-muted-foreground mb-8">
          Installing dependencies... Please wait.
        </p>
        <Link to="/dashboard" className="text-primary hover:underline">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default EditPage;
