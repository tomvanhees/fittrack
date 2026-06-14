// components/progress/LineChart.tsx
// Lijngrafiek voor een tijdreeks (bv. max gewicht per sessie).

import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { colors, fontSize, spacing } from '@/constants/colors';

export interface LinePoint {
  date: string; // ISO datum
  value: number;
}

interface LineChartProps {
  points: LinePoint[];
  width: number;
  height?: number;
  color?: string;
  unit?: string; // bv. "kg"
}

const PAD_TOP = 18;
const PAD_BOTTOM = 22;
const PAD_X = 12;

/** "2026-06-14" → "14/6" */
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d}/${m}`;
}

export function LineChart({
  points,
  width,
  height = 190,
  color = colors.primary,
  unit = 'kg',
}: LineChartProps) {
  if (points.length === 0) return null;

  const plotW = width - PAD_X * 2;
  const plotH = height - PAD_TOP - PAD_BOTTOM;
  const values = points.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;

  const xFor = (i: number) =>
    points.length === 1 ? width / 2 : PAD_X + (i / (points.length - 1)) * plotW;
  const yFor = (v: number) => PAD_TOP + (1 - (v - min) / span) * plotH;

  const polyPoints = points.map((p, i) => `${xFor(i)},${yFor(p.value)}`).join(' ');
  const lastIdx = points.length - 1;

  return (
    <View>
      <Svg width={width} height={height}>
        {/* basislijn */}
        <Line
          x1={0}
          y1={PAD_TOP + plotH}
          x2={width}
          y2={PAD_TOP + plotH}
          stroke={colors.border}
          strokeWidth={1}
        />
        {points.length > 1 ? (
          <Polyline
            points={polyPoints}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {points.map((p, i) => (
          <Circle
            key={p.date}
            cx={xFor(i)}
            cy={yFor(p.value)}
            r={i === lastIdx ? 4 : 2.5}
            fill={i === lastIdx ? color : colors.surface}
            stroke={color}
            strokeWidth={1.5}
          />
        ))}
        {/* waarde van het laatste punt */}
        <SvgText
          x={Math.min(xFor(lastIdx), width - 24)}
          y={Math.max(yFor(points[lastIdx].value) - 8, 12)}
          fill={colors.text}
          fontSize={fontSize.sm}
          fontWeight="700"
          textAnchor="middle"
        >
          {`${Math.round(points[lastIdx].value)}`}
        </SvgText>
        {/* x-as: eerste en laatste datum */}
        <SvgText x={PAD_X} y={height - 6} fill={colors.textFaint} fontSize={9} textAnchor="start">
          {shortDate(points[0].date)}
        </SvgText>
        {points.length > 1 ? (
          <SvgText
            x={width - PAD_X}
            y={height - 6}
            fill={colors.textFaint}
            fontSize={9}
            textAnchor="end"
          >
            {shortDate(points[lastIdx].date)}
          </SvgText>
        ) : null}
      </Svg>
      <View style={styles.legend}>
        <Text style={styles.legendText}>
          Min {Math.round(min)} {unit} • Max {Math.round(max)} {unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    marginTop: spacing.xs,
  },
  legendText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
});
