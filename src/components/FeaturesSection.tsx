import { Zap, Sparkles, MessageCircle } from "lucide-react";

const features = [
  { icon: Zap, title: "יצירה מהירה", desc: "מרעיון לסרטון בפחות משעה" },
  { icon: Sparkles, title: "AI מתקדם", desc: "תמונות, אנימציה, מוזיקה וקריינות אוטומטית" },
  { icon: MessageCircle, title: "WhatsApp נוח", desc: "כל התהליך קורה בתוך WhatsApp" },
];

const FeaturesSection = () => (
  <section className="py-20 bg-muted/30">
    <div className="container mx-auto px-4">
      <h2 className="mb-12 text-center text-3xl font-bold text-foreground md:text-4xl">למה Pixi?</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((f, i) => (
          <div
            key={i}
            className="group rounded-2xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <f.icon className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">{f.title}</h3>
            <p className="text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
