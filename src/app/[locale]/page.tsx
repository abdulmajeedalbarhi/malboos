import { redirect } from "@/i18n/routing";

export default function LocalePage() {
    redirect({ href: "/dashboard", locale: "ar" });
}
