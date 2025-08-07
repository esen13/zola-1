import { APP_NAME } from "@/lib/config"

export function AppInfoContent() {
  return (
    <div className="space-y-4">
      <p className="text-foreground leading-relaxed">
        <span className="font-medium">{APP_NAME}</span> is co-pilot for your
        business.
      </p>
    </div>
  )
}
