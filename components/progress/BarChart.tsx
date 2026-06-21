// components/progress/BarChart.tsx
// Verticale staafgrafiek. Tik op een staaf om de waarde te tonen.

import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts, fontSize } from '@/constants/colors';
import type { PeriodValue } from '@/lib/stats';

interface BarChartProps {
  data: PeriodValue[];
  width: number;
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}

const TOP_PAD = 26; // ruimte voor het waardelabel boven de geselecteerde staaf
const BOTTOM_PAD = 20; // ruimte voor de as-labels

export function BarChart({
  data,
  width,
  height = 190,
  color = colors.primary,
  formatValue = (v) => String(Math.round(v)),
}: BarChartProps) {
  const [selected, setSelected] = useState<number | null>(null);

  if (data.length === 0) return null;

  const plotHeight = height - TOP_PAD - BOTTOM_PAD;
  const max = Math.max(...data.map((d) => d.value), 1);
  const slot = width / data.length;
  const barWidth = Math.max(4, slot * 0.55);
  // Standaard: laatste staaf met data geselecteerd, anders de laatste.
  const lastWithData = data.reduce((acc, d, i) => (d.value > 0 ? i : acc), -1);
  const active = selected ?? (lastWithData >= 0 ? lastWithData : data.length - 1);

  return (
    <View>
      <Svg width={width} height={height}>
        {/* basislijn */}
        <Line
          x1={0}
          y1={TOP_PAD + plotHeight}
          x2={width}
          y2={TOP_PAD + plotHeight}
          stroke={colors.border}
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const barHeight = max > 0 ? (d.value / max) * plotHeight : 0;
          const x = i * slot + (slot - barWidth) / 2;
          const y = TOP_PAD + (plotHeight - barHeight);
          const isActive = i === active;
          return (
            <Rect
              key={d.period}
              x={x}
              y={d.value > 0 ? y : TOP_PAD + plotHeight - 2}
              width={barWidth}
              height={d.value > 0 ? barHeight : 2}
              rx={3}
              fill={color}
              opacity={isActive ? 1 : 0.32}
              onPress={() => setSelected(i)}
            />
          );
        })}
        {/* waardelabel boven de geselecteerde staaf */}
        {(() => {
          const d = data[active];
          const slotCenter = active * slot + slot / 2;
          const labelX = Math.min(Math.max(slotCenter, 18), width - 18);
          return (
            <SvgText
              x={labelX}
              y={TOP_PAD - 10}
              fill={colors.text}
              fontSize={fontSize.sm}
              fontFamily={fonts.grotesk700}
              textAnchor="middle"
            >
              {formatValue(d.value)}
            </SvgText>
          );
        })()}
        {/* as-labels */}
        {data.map((d, i) => (
          <SvgText
            key={`l-${d.period}`}
            x={i * slot + slot / 2}
            y={height - 6}
            fill={i === active ? colors.text : colors.textFaint}
            fontSize={9}
            textAnchor="middle"
          >
            {d.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}
