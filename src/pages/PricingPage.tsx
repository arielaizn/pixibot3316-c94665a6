import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useDirection } from "@/contexts/DirectionContext";
import { Check, Zap, Star, Crown, Building2, Rocket, Package, AlertCircle } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

interface Plan {
  key: string;
  nameHe: string;
  nameEn: string;
  credits: number;
  monthlyPrice: number;
  yearlyPrice: number;
  featuresHe: string[];
  featuresEn: string[];
  icon: React.ElementType;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    key: "starter",
    nameHe: "Starter",
    nameEn: "Starter",
    credits: 3,
    monthlyPrice: 49,
    yearlyPrice: 470,
    icon: Zap,
    featuresHe: ["3 סרטוני AI בחודש", "דשבורד אישי", "ניהול פרויקטים", "תמיכה רגילה"],
    featuresEn: ["3 AI videos / month", "Personal dashboard", "Project management", "Standard support"],
  },
  {
    key: "creator",
    nameHe: "Creator",
    nameEn: "Creator",
    credits: 7,
    monthlyPrice: 99,
    yearlyPrice: 950,
    icon: Star,
    featuresHe: ["7 סרטוני AI בחודש", "כל הכלים של Starter", "עדיפות בתור", "תמיכה מועדפת"],
    featuresEn: ["7 AI videos / month", "All Starter tools", "Queue priority", "Preferred support"],
  },
  {
    key: "pro",
    nameHe: "Pro",
    nameEn: "Pro",
    credits: 15,
    monthlyPrice: 199,
    yearlyPrice: 1910,
    icon: Crown,
    popular: true,
    featuresHe: ["15 סרטוני AI בחודש", "כל הכלים של Creator", "עדיפות גבוהה", "תמיכה פרימיום"],
    featuresEn: ["15 AI videos / month", "All Creator tools", "High priority", "Premium support"],
  },
  {
    key: "business",
    nameHe: "Business",
    nameEn: "Business",
    credits: 35,
    monthlyPrice: 399,
    yearlyPrice: 3830,
    icon: Building2,
    featuresHe: ["35 סרטוני AI בחודש", "כל הכלים של Pro", "מנהל חשבון", "SLA מובטח"],
    featuresEn: ["35 AI videos / month", "All Pro tools", "Account manager", "Guaranteed SLA"],
  },
  {
    key: "enterprise",
    nameHe: "Enterprise",
    nameEn: "Enterprise",
    credits: 80,
    monthlyPrice: 799,
    yearlyPrice: 7670,
    icon: Rocket,
    featuresHe: ["80 סרטוני AI בחודש", "כל הכלים של Business", "אינטגרציות מותאמות", "תמיכה 24/7"],
    featuresEn: ["80 AI videos / month", "All Business tools", "Custom integrations", "24/7 support"],
  },
];

interface Pack {
  videos: number;
  price: number;
  descHe: string;
  descEn: string;
}

const packs: Pack[] = [
  { videos: 3, price: 129, descHe: "הוסיפו 3 קרדיטים למסלול הקיים", descEn: "Add 3 credits to your current plan" },
  { videos: 10, price: 349, descHe: "הוסיפו 10 קרדיטים במחיר מוזל", descEn: "Add 10 credits at a discounted price" },
  { videos: 25, price: 699, descHe: "הוסיפו 25 קרדיטים במחיר משתלם במיוחד", descEn: "Add 25 credits at the best value" },
];

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

const PricingPage = () => {
  const { isRTL } = useDirection();
  const [yearly, setYearly] = useState(false);

  const t = {
    title: isRTL ? "תוכניות ומחירים" : "Plans & Pricing",
    subtitle: isRTL
      ? "בחרו את החבילה שמתאימה לכם והתחילו ליצור סרטוני AI"
      : "Choose the plan that fits you and start creating AI videos",
    trust: isRTL
      ? "🎬 הסרטון הראשון חינם — ללא כרטיס אשראי"
      : "🎬 First video free — no credit card required",
    monthly: isRTL ? "חודשי" : "Monthly",
    yearly: isRTL ? "שנתי" : "Yearly",
    save: isRTL ? "חסכו 20%" : "Save 20%",
    cta: isRTL ? "המשיכו לתשלום" : "Continue to Payment",
    creditsLabel: (n: number) => (isRTL ? `${n} קרדיטים (סרטונים)` : `${n} credits (videos)`),
    perMonth: isRTL ? "/ חודש" : "/ month",
    perYear: isRTL ? "/ שנה" : "/ year",
    popular: isRTL ? "פופולרי" : "Popular",
    creditTitle: isRTL ? "איך הקרדיטים עובדים?" : "How do credits work?",
    creditText: isRTL
      ? "כל סרטון שאתם יוצרים משתמש בקרדיט אחד. אם הקרדיטים נגמרים תוכלו לשדרג את החבילה או לרכוש קרדיטים נוספים."
      : "Each video you create uses one credit. If you run out, you can upgrade your plan or purchase additional credits.",
    packTitle: isRTL ? "נגמרו הקרדיטים?" : "Out of credits?",
    packSubtitle: isRTL ? "קנו קרדיטים נוספים או שדרגו מסלול" : "Buy additional credits or upgrade your plan",
    packCta: isRTL ? "רכישה" : "Purchase",
    packVideos: (n: number) => (isRTL ? `חבילת ${n} סרטונים` : `${n} Video Pack`),
    packNote: isRTL
      ? "חבילות קרדיטים זמינות למנויים פעילים בלבד."
      : "Credit packs are only available for active subscribers.",
    usageTitle: isRTL ? "מתקרבים לסוף הקרדיטים?" : "Running low on credits?",
    usageText: isRTL
      ? "קנו קרדיטים נוספים או שדרגו מסלול."
      : "Buy additional credits or upgrade your plan.",
    usageUsed: isRTL ? "קרדיטים נוצלו" : "credits used",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12 md:py-20">
        {/* ── HEADER ── */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="mb-4 text-3xl font-extrabold text-foreground md:text-5xl">{t.title}</h1>
          <p className="mb-4 text-lg text-muted-foreground">{t.subtitle}</p>
          <span className="inline-block rounded-full bg-primary/10 px-5 py-2 text-sm font-semibold text-primary">
            {t.trust}
          </span>
        </div>

        {/* ── BILLING TOGGLE ── */}
        <div className="mx-auto mb-12 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>
            {t.monthly}
          </span>
          <Switch checked={yearly} onCheckedChange={setYearly} />
          <span className={`text-sm font-medium ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
            {t.yearly}
          </span>
          {yearly && (
            <Badge className="animate-scale-in bg-primary/10 text-primary hover:bg-primary/20 border-0">
              {t.save}
            </Badge>
          )}
        </div>

        {/* ── PLANS GRID ── */}
        <div className="mx-auto mb-20 grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const features = isRTL ? plan.featuresHe : plan.featuresEn;
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
            const period = yearly ? t.perYear : t.perMonth;

            return (
              <div
                key={plan.key}
                className={`relative flex flex-col rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  plan.popular
                    ? "border-primary bg-primary/[0.03] shadow-primary/10 ring-2 ring-primary/20 dark:bg-primary/[0.06]"
                    : "border-border bg-card"
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 border-0 bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                    {t.popular}
                  </Badge>
                )}

                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="mb-1 text-lg font-bold text-foreground">{isRTL ? plan.nameHe : plan.nameEn}</h3>
                <p className="mb-4 text-xs text-muted-foreground">{t.creditsLabel(plan.credits)}</p>

                <div className="mb-5">
                  <span className="text-3xl font-extrabold text-foreground">₪{price}</span>
                  <span className="ms-1 text-sm text-muted-foreground">{period}</span>
                </div>

                <ul className="mb-6 flex-1 space-y-2.5">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full rounded-xl py-5 text-sm font-bold ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {t.cta}
                </Button>
              </div>
            );
          })}
        </div>

        {/* ── CREDIT EXPLANATION ── */}
        <div className="mx-auto mb-16 max-w-2xl rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h2 className="mb-3 text-xl font-bold text-foreground">{t.creditTitle}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t.creditText}</p>
        </div>

        {/* ── USAGE PRESSURE ── */}
        <div className="mx-auto mb-16 max-w-md rounded-2xl border border-primary/20 bg-primary/[0.03] p-6 text-center shadow-sm dark:bg-primary/[0.06]">
          <p className="mb-3 text-3xl font-extrabold text-foreground">🎬 12 / 15</p>
          <p className="mb-1 text-sm font-semibold text-foreground">{t.usageUsed}</p>
          <p className="text-sm text-muted-foreground">{t.usageText}</p>
        </div>

        {/* ── ADDITIONAL PACKS ── */}
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-extrabold text-foreground">{t.packTitle}</h2>
            <p className="text-muted-foreground">{t.packSubtitle}</p>
          </div>

          <div className="mb-6 grid gap-5 sm:grid-cols-3">
            {packs.map((pack) => (
              <div
                key={pack.videos}
                className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Package className="h-5 w-5" />
                </div>
                <h3 className="mb-1 text-lg font-bold text-foreground">{t.packVideos(pack.videos)}</h3>
                <p className="mb-2 text-2xl font-extrabold text-foreground">₪{pack.price}</p>
                <p className="mb-5 flex-1 text-center text-sm text-muted-foreground">
                  {isRTL ? pack.descHe : pack.descEn}
                </p>
                <Button variant="outline" className="w-full rounded-xl border-accent py-4 text-accent hover:bg-accent hover:text-accent-foreground">
                  {t.packCta}
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            {t.packNote}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PricingPage;
