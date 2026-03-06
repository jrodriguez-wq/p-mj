"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MONTHS } from "@/lib/types";

interface DataPoint {
  month: number;
  year: number;
  collected: number;
}

interface IncomeChartProps {
  data?: DataPoint[];
  loading?: boolean;
}

const formatCurrency = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

const formatLabel = (d: DataPoint) => `${MONTHS[d.month - 1]} ${d.year}`;

export const IncomeChart = ({ data = [], loading }: IncomeChartProps) => {
  const chartData = data.map((d) => ({
    name: `${MONTHS[d.month - 1]}'${String(d.year).slice(2)}`,
    collected: d.collected,
  }));

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Income — Last 12 months
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "hsl(var(--foreground))",
                }}
                formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Collected"]}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Area
                type="monotone"
                dataKey="collected"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#incomeGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
