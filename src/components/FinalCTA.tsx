import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const FinalCTA = () => (
  <section className="relative overflow-hidden py-24">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10" />
    <div className="container relative mx-auto px-4 text-center">
      <h2 className="mb-4 text-3xl font-bold text-foreground md:text-5xl">מוכן ליצור סרטון AI?</h2>
      <p className="mb-8 text-lg text-muted-foreground">התחל עכשיו וקבל את הסרטון הראשון שלך בחינם</p>
      <Button asChild size="lg" className="rounded-full bg-primary px-10 text-lg font-bold text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all">
        <Link to="/signup">התחל עכשיו</Link>
      </Button>
    </div>
  </section>
);

export default FinalCTA;
