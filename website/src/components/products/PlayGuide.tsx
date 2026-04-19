import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlayGuideData } from "@/lib/play-guides";

interface PlayGuideProps {
  data: PlayGuideData;
  color: string;
}

export function PlayGuide({ data, color }: PlayGuideProps) {
  return (
    <div className="space-y-6">
      {/* Quick info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">Giá vé</div>
            <div className="text-xl font-bold" style={{ color }}>
              {data.ticketPrice}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">Lịch quay</div>
            <div className="text-sm font-semibold leading-snug">{data.schedule}</div>
          </CardContent>
        </Card>
        {data.overallOdds && (
          <Card>
            <CardContent className="pt-5 pb-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">Xác suất trúng bất kỳ</div>
              <div className="text-xl font-bold" style={{ color }}>
                {data.overallOdds}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* How to play */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            📖 Cách chơi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {data.howToPlay.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Prize structure */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            🏆 Cơ cấu giải thưởng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Hạng giải</TableHead>
                <TableHead>Điều kiện trúng</TableHead>
                <TableHead className="text-right w-[140px]">Tỷ lệ trúng</TableHead>
                <TableHead className="text-right w-[160px]">Giải thưởng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.prizes.map((tier, i) => (
                <TableRow key={i} className={tier.highlight ? "bg-primary/5" : undefined}>
                  <TableCell className="font-medium">
                    {tier.highlight ? (
                      <Badge
                        className="text-xs text-white"
                        style={{ backgroundColor: color }}
                      >
                        {tier.name}
                      </Badge>
                    ) : (
                      tier.name
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tier.condition}
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-muted-foreground">
                    {tier.odds}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${tier.highlight ? "text-lg" : "text-sm"}`}
                    style={tier.highlight ? { color } : undefined}
                  >
                    {tier.prize}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tips */}
      {data.tips && data.tips.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              💡 Lưu ý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="text-primary shrink-0">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
