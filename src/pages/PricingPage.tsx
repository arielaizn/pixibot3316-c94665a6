import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CreditBar from "@/components/CreditBar";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/contexts/AuthContext";
import { useDirection } from "@/contexts/DirectionContext";
import { usePayment } from "@/hooks/usePayment";
import { Check, Zap, Star, Crown, Building2, Rocket, Package, AlertCircle, Loader2 } from "lucide-react";

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
  { key: "starter", nameHe: "Starter", nameEn: "Starter", credits: 3, monthlyPrice: 49, yearlyPrice: 470, icon: Zap, featuresHe: ["3 סרטוני AI בחודש", "דשבורד אישי", "ניהול פרויקטים", "תמיכה רגילה"], featuresEn: ["3 AI videos / month", "Personal dashboard", "Project management", "Standard support"] },
  { key: "creator", nameHe: "Creator", nameEn: "Creator", credits: 7, monthlyPrice: 99, yearlyPrice: 950, icon: Star, featuresHe: ["7 סרטוני AI בחודש", "כל הכלים של Starter", "עדיפות בתור", "תמיכה מועדפת"], featuresEn: ["7 AI videos / month", "All Starter tools", "Queue priority", "Preferred support"] },
  { key: "pro", nameHe: "Pro", nameEn: "Pro", credits: 15, monthlyPrice: 199, yearlyPrice: 1910, icon: Crown, popular: true, featuresHe: ["15 סרטוני AI בחודש", "כל הכלים של Creator", "עדיפות גבוהה", "תמיכה פרימיום"], featuresEn: ["15 AI videos / month", "All Creator tools", "High priority", "Premium support"] },
  { key: "business", nameHe: "Business", nameEn: "Business", credits: 35, monthlyPrice: 399, yearlyPrice: 3830, icon: Building2, featuresHe: ["35 סרטוני AI בחודש", "כל הכלים של Pro", "מנהל חשבון", "SLA מובטח"], featuresEn: ["35 AI videos / month", "All Pro tools", "Account manager", "Guaranteed SLA"] },
  { key: "enterprise", nameHe: "Enterprise", nameEn: "Enterprise", credits: 80, monthlyPrice: 799, yearlyPrice: 7670, icon: Rocket, featuresHe: ["80 סרטוני AI בחודש", "כל הכלים של Business", "אינטגרציות מותאמות", "תמיכה 24/7"], featuresEn: ["80 AI videos / month", "All Business tools", "Custom integrations", "24/7 support"] },
];

interface Pack { videos: number; price: number; descHe: string; descEn: string; }
const packs: Pack[] = [
  { videos: 3, price: 129, descHe: "הוסיפו 3 קרדיטים למסלול הקיים", descEn: "Add 3 credits to your current plan" },
  { videos: 10, price: 349, descHe: "הוסיפו 10 קרדיטים במחיר מוזל", descEn: "Add 10 credits at a discounted price" },
  { videos: 25, price: 699, descHe: "הוסיפו 25 קרדיטים במחיר משתלם במיוחד", descEn: "Add 25 credits at the best value" },
];

const PricingPage = () => {
  const { isRTL, t } = useDirection();
  const [yearly, setYearly] = useState(false);
  const { user } = useAuth();
  const { credits } = useCredits();
  const navigate = useNavigate();
  const { startSubscription, buyCredits, loading: paymentLoading } = usePayment();

  const isUnlimited = credits?.isUnlimited;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="mb-4 text-3xl font-extrabold text-foreground md:text-5xl">{t("pricing.title")}</h1>
          <p className="mb-4 text-lg text-muted-foreground">{t("pricing.subtitle")}</p>
          <span className="inline-block rounded-full bg-primary/10 px-5 py-2 text-sm font-semibold text-primary">{t("pricing.trust")}</span>
          {!user && <p className="mt-4 text-sm text-muted-foreground">{t("pricing.loginToSee")}</p>}
        </div>

        {user && isUnlimited && (
          <div className="mx-auto mb-16 max-w-md rounded-2xl border border-primary/20 bg-primary/[0.03] p-8 shadow-sm dark:bg-primary/[0.06] text-center">
            <p className="text-4xl font-extrabold text-foreground mb-2">🎬 ∞</p>
            <p className="text-lg font-bold text-foreground mb-1">{t("pricing.adminUnlimited")}</p>
            <p className="text-sm text-muted-foreground">{t("pricing.adminUnlimitedDesc")}</p>
          </div>
        )}

        {!isUnlimited && (
          <>
            <div className="mx-auto mb-12 flex flex-col items-center gap-3">
              <div className="relative flex h-12 w-64 cursor-pointer select-none items-center rounded-full border border-border bg-muted p-1" role="radiogroup">
                <div className={`absolute top-1 h-10 w-[calc(50%-4px)] rounded-full bg-primary shadow-lg shadow-primary/25 transition-all duration-300 ease-out ${yearly ? "start-[calc(50%+2px)]" : "start-1"}`} />
                <button role="radio" aria-checked={!yearly} onClick={() => setYearly(false)} className={`relative z-10 flex h-10 flex-1 items-center justify-center rounded-full text-sm font-bold transition-colors duration-200 ${!yearly ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{t("pricing.monthly")}</button>
                <button role="radio" aria-checked={yearly} onClick={() => setYearly(true)} className={`relative z-10 flex h-10 flex-1 items-center justify-center rounded-full text-sm font-bold transition-colors duration-200 ${yearly ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{t("pricing.yearly")}</button>
              </div>
              {yearly && <Badge className="animate-fade-in bg-primary/10 text-primary hover:bg-primary/20 border-0 text-xs">{t("pricing.save")}</Badge>}
            </div>

            <div className="mx-auto mb-20 grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {plans.map((plan) => {
                const Icon = plan.icon;
                const features = isRTL ? plan.featuresHe : plan.featuresEn;
                const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
                const period = yearly ? t("pricing.perYear") : t("pricing.perMonth");
                const creditsLabel = isRTL ? `${plan.credits} קרדיטים (סרטונים)` : `${plan.credits} credits (videos)`;

                return (
                  <div key={plan.key} className={`relative flex flex-col rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${plan.popular ? "border-primary bg-primary/[0.03] shadow-primary/10 ring-2 ring-primary/20 dark:bg-primary/[0.06]" : "border-border bg-card"}`}>
                    {plan.popular && <Badge className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 border-0 bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">{t("pricing.popular")}</Badge>}
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                    <h3 className="mb-1 text-lg font-bold text-foreground">{isRTL ? plan.nameHe : plan.nameEn}</h3>
                    <p className="mb-4 text-xs text-muted-foreground">{creditsLabel}</p>
                    <div className="mb-5"><span className="text-3xl font-extrabold text-foreground">₪{price}</span><span className="ms-1 text-sm text-muted-foreground">{period}</span></div>
                    <ul className="mb-6 flex-1 space-y-2.5">{features.map((f, i) => (<li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{f}</li>))}</ul>
                    <Button disabled={paymentLoading} onClick={() => { if (!user) { navigate("/signup"); return; } startSubscription(plan.key, yearly ? "yearly" : "monthly"); }} className={`w-full rounded-xl py-5 text-sm font-bold ${plan.popular ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>{paymentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("pricing.cta")}</Button>
                  </div>
                );
              })}
            </div>

            <div className="mx-auto mb-16 max-w-2xl rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
              <h2 className="mb-3 text-xl font-bold text-foreground">{t("pricing.creditTitle")}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{t("pricing.creditText")}</p>
            </div>

            {user && credits && !credits.isUnlimited && (
              <div className="mx-auto mb-16 max-w-md rounded-2xl border border-primary/20 bg-primary/[0.03] p-6 shadow-sm dark:bg-primary/[0.06]">
                <CreditBar credits={credits} showPlan showWarning />
              </div>
            )}
            {!user && (
              <div className="mx-auto mb-16 max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
                <p className="mb-3 text-lg font-semibold text-foreground">{t("pricing.loginToSeeCredits")}</p>
                <div className="flex justify-center gap-3">
                  <Button asChild size="sm" className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"><Link to="/login">{t("nav.login")}</Link></Button>
                  <Button asChild size="sm" variant="outline" className="rounded-lg"><Link to="/signup">{t("nav.signup")}</Link></Button>
                </div>
              </div>
            )}

            <div className="mx-auto max-w-4xl">
              <div className="mb-8 text-center">
                <h2 className="mb-2 text-2xl font-extrabold text-foreground">{t("pricing.packTitle")}</h2>
                <p className="text-muted-foreground">{t("pricing.packSubtitle")}</p>
              </div>
              <div className="mb-6 grid gap-5 sm:grid-cols-3">
                {packs.map((pack) => {
                  const packLabel = isRTL ? `חבילת ${pack.videos} סרטונים` : `${pack.videos} Video Pack`;
                  return (
                    <div key={pack.videos} className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent"><Package className="h-5 w-5" /></div>
                      <h3 className="mb-1 text-lg font-bold text-foreground">{packLabel}</h3>
                      <p className="mb-2 text-2xl font-extrabold text-foreground">₪{pack.price}</p>
                      <p className="mb-5 flex-1 text-center text-sm text-muted-foreground">{isRTL ? pack.descHe : pack.descEn}</p>
                      <Button variant="outline" disabled={paymentLoading} onClick={() => { if (!user) { navigate("/signup"); return; } buyCredits(pack.videos, pack.price); }} className="w-full rounded-xl border-accent py-4 text-accent hover:bg-accent hover:text-accent-foreground">{paymentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("pricing.packCta")}</Button>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><AlertCircle className="h-3.5 w-3.5" />{t("pricing.packNote")}</div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default PricingPage;
