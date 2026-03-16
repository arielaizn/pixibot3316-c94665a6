import { UserPlus, MessageSquare, Video } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "הירשם בחינם" },
  { icon: MessageSquare, title: "ספר לנו מה אתה רוצה ב-WhatsApp" },
  { icon: Video, title: "קבל את הסרטון המוגמר" },
];

const HowItWorksSection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <h2 className="mb-16 text-center text-3xl font-bold text-foreground md:text-4xl">איך זה עובד?</h2>
      <div className="flex flex-col items-center gap-8 md:flex-row md:justify-center md:gap-0">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
                <step.icon className="h-7 w-7" />
              </div>
              <span className="mb-1 text-sm font-bold text-primary">שלב {i + 1}</span>
              <p className="max-w-[180px] text-sm font-medium text-foreground">{step.title}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="mx-8 hidden h-0.5 w-16 bg-border md:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
