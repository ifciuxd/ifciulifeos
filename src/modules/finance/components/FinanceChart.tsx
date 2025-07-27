import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useGlobalStore } from '../../../../core/state/GlobalStore';
import { ifciuDarkTheme } from '../../../../ui/themes/ifciuDark';
import { financeCore } from '../FinanceCore';
import GlassCard from '../../../../ui/components/layout/GlassCard';

interface FinanceChartProps {
  type: 'income' | 'expenses' | 'savings' | 'category';
  period: 'week' | 'month' | 'year';
  className?: string;
}

export const FinanceChart: React.FC<FinanceChartProps> = ({ type, period, className = '' }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { finances } = useGlobalStore();

  useEffect(() => {
    if (!svgRef.current || !finances.income.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const data = prepareChartData();

    const xScale = d3.scaleBand<string>()
      .domain(data.map(d => d.label))
      .range([0, innerWidth])
      .padding(0.2);

    const yMax = d3.max(data, d => d.value) || 0;
    const yScale = d3.scaleLinear()
      .domain([0, yMax * 1.1])
      .range([innerHeight, 0]);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat('' as any)
      )
      .selectAll('line')
      .attr('stroke', ifciuDarkTheme.colors.secondaryBg)
      .attr('stroke-opacity', 0.5);

    // bars
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.label)!)
      .attr('y', d => yScale(d.value))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.value))
      .attr('fill', d => getColorForValue(d.value, yMax))
      .attr('rx', 4)
      .attr('ry', 4)
      .on('mouseover', (event, d) => showTooltip(event as MouseEvent, d))
      .on('mouseout', hideTooltip);

    // axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('fill', ifciuDarkTheme.colors.textSecondary)
      .style('font-size', '12px');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .attr('fill', ifciuDarkTheme.colors.textSecondary)
      .style('font-size', '12px');

    function prepareChartData() {
      if (type === 'category') {
        const categoryMap: Record<string, number> = {};
        finances.expenses.forEach(t => {
          categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
        });
        return Object.entries(categoryMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([label, value]) => ({ label, value }));
      }

      const now = new Date();
      const months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(now);
        date.setMonth(now.getMonth() - (5 - i));
        return date;
      });

      return months.map(date => {
        const month = date.getMonth();
        const year = date.getFullYear();
        const income = finances.income.filter(t => new Date(t.date).getMonth() === month && new Date(t.date).getFullYear() === year).reduce((sum, t) => sum + t.amount, 0);
        const expenses = finances.expenses.filter(t => new Date(t.date).getMonth() === month && new Date(t.date).getFullYear() === year).reduce((sum, t) => sum + t.amount, 0);
        return {
          label: date.toLocaleDateString('pl-PL', { month: 'short' }),
          value: type === 'income' ? income : type === 'expenses' ? expenses : income - expenses,
        };
      });
    }

    function getColorForValue(value: number, max: number) {
      if (type === 'savings') {
        return value >= 0 ? ifciuDarkTheme.colors.success : ifciuDarkTheme.colors.error;
      }
      const ratio = value / max;
      if (ratio > 0.7) return ifciuDarkTheme.colors.error;
      if (ratio > 0.4) return ifciuDarkTheme.colors.warning;
      return ifciuDarkTheme.colors.accentPrimary;
    }

    function showTooltip(event: MouseEvent, d: { label: string; value: number }) {
      if (!tooltipRef.current) return;
      tooltipRef.current.style.display = 'block';
      tooltipRef.current.style.left = `${event.pageX + 10}px`;
      tooltipRef.current.style.top = `${event.pageY + 10}px`;
      tooltipRef.current.innerHTML = `<div class="p-2 rounded-lg bg-ifciu-tertiaryBg border border-ifciu-secondaryBg"><strong>${d.label}</strong><br/>${d.value.toFixed(2)} PLN</div>`;
    }

    function hideTooltip() {
      if (tooltipRef.current) tooltipRef.current.style.display = 'none';
    }
  }, [finances, type, period]);

  return (
    <div className={`relative ${className}`}>
      <svg ref={svgRef} width="100%" height="300" className="rounded-lg" />
      <div ref={tooltipRef} className="absolute hidden pointer-events-none z-50" />
    </div>
  );
};

// Summary wrapper
export const FinanceSummary: React.FC = () => {
  const analysis = financeCore.analyzeFinances();
  const health = financeCore.getFinancialHealth();

  const healthColors = {
    excellent: ifciuDarkTheme.colors.success,
    good: ifciuDarkTheme.colors.accentSecondary,
    warning: ifciuDarkTheme.colors.warning,
    critical: ifciuDarkTheme.colors.error,
  } as const;

  return (
    <GlassCard className="p-4">
      <h3 className="text-lg font-semibold mb-4">Podsumowanie finansowe</h3>
      {/* Monthly summary grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-ifciu-secondaryBg">
          <div className="text-sm text-ifciu-textSecondary mb-1">Przychody</div>
          <div className="text-xl font-bold">{analysis.monthlySummary.income.toFixed(2)} PLN</div>
        </div>
        <div className="p-3 rounded-lg bg-ifciu-secondaryBg">
          <div className="text-sm text-ifciu-textSecondary mb-1">Wydatki</div>
          <div className="text-xl font-bold">{analysis.monthlySummary.expenses.toFixed(2)} PLN</div>
        </div>
        <div className="p-3 rounded-lg bg-ifciu-secondaryBg">
          <div className="text-sm text-ifciu-textSecondary mb-1">Oszczędności</div>
          <div className="text-xl font-bold" style={{ color: analysis.monthlySummary.savings >= 0 ? ifciuDarkTheme.colors.success : ifciuDarkTheme.colors.error }}>
            {analysis.monthlySummary.savings.toFixed(2)} PLN
          </div>
        </div>
        <div className="p-3 rounded-lg bg-ifciu-secondaryBg flex items-center">
          <div>
            <div className="text-sm text-ifciu-textSecondary mb-1">Status</div>
            <div className="text-xl font-bold capitalize" style={{ color: healthColors[health] }}>{health}</div>
          </div>
          <div className="ml-auto w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${healthColors[health]}20`, border: `1px solid ${healthColors[health]}` }}>
            {health === 'excellent' && '⭐'}
            {health === 'good' && '👍'}
            {health === 'warning' && '⚠️'}
            {health === 'critical' && '❗'}
          </div>
        </div>
      </div>

      <FinanceChart type="expenses" period="month" className="mb-6" />

      <div>
        <h4 className="font-semibold mb-2">Sugestie optymalizacji</h4>
        <ul className="space-y-2">
          {analysis.suggestions.map((s, i) => (
            <li key={i} className="flex items-start">
              <div className="w-2 h-2 rounded-full bg-ifciu-accentPrimary mt-2 mr-2 flex-shrink-0" />
              <span className="text-sm">{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </GlassCard>
  );
};
