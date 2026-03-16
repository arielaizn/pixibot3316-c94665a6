import { Link } from "react-router-dom";

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="text-center">
      <h1 className="mb-4 text-4xl font-bold text-foreground">{title}</h1>
      <p className="mb-6 text-muted-foreground">העמוד בבנייה 🚧</p>
      <Link to="/" className="text-primary hover:underline">חזרה לדף הבית</Link>
    </div>
  </div>
);

export default PlaceholderPage;
