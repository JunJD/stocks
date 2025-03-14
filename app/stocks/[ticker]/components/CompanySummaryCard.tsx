import { Card, CardContent } from "../../../../components/ui/card"
import ReadMoreText from "../../../../components/ui/read-more-text"
import Link from "next/link"
import { fetchQuoteSummary } from "@/lib/yahoo-finance/fetchQuoteSummary"

export default async function CompanySummaryCard({
  ticker,
}: {
  ticker: string
}) {
  const data = await fetchQuoteSummary(ticker)

  if (!data.summaryDetail) {
    return null
  }
  
  // 提取需要的公司信息
  const longBusinessSummary = data.longBusinessSummary || ""
  const sector = data.sector || ""
  const industryDisp = data.industry || ""
  const country = data.country || ""
  const fullTimeEmployees = data.fullTimeEmployees || 0
  const website = data.website || ""

  return (
    <Card className="group relative min-h-max overflow-hidden">
      <div className="absolute z-0 h-full w-full bg-gradient-to-t from-neutral-50 via-neutral-200 to-neutral-50 bg-size-200 bg-pos-0 blur-2xl transition-all duration-500 group-hover:bg-pos-100 dark:from-black dark:via-blue-950 dark:to-black" />

      <CardContent className="z-50 flex h-full w-full flex-col items-start justify-center gap-6 py-10 text-sm lg:flex-row">
        <div className="z-50 max-w-2xl text-pretty font-medium">
          <ReadMoreText text={longBusinessSummary ?? ""} truncateLength={500} />
        </div>
        {sector && industryDisp && country && fullTimeEmployees && website && (
          <div className="z-50 min-w-fit font-medium text-muted-foreground">
            <div>
              Sector: <span className="text-foreground ">{sector}</span>
            </div>
            <div>
              Industry: <span className="text-foreground ">{industryDisp}</span>
            </div>
            <div>
              Country: <span className="text-foreground ">{country}</span>
            </div>
            <div>
              Employees:{" "}
              <span className="text-foreground ">
                {fullTimeEmployees?.toLocaleString("en-US")}
              </span>
            </div>
            <div>
              Website:{" "}
              <span className="text-foreground ">
                {website && (
                  <Link
                    href={website}
                    className="text-blue-600 hover:underline dark:text-blue-500"
                  >
                    {website}
                  </Link>
                )}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
