import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ifciuDarkTheme } from "../../themes/ifciuDark";

interface EnergyRadialChartProps {
  value: number;
  max: number;
  label?: string;
  color?: string;
  size?: number;
}

const EnergyRadialChart: React.FC<EnergyRadialChartProps> = ({
  value,
  max = 100,
  label = '',
  color = ifciuDarkTheme.colors.accentPrimary,
  size = 120
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const radius = size / 2;
  const strokeWidth = 8;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${radius},${radius})`);

    // Tło
    g.append('circle')
      .attr('r', radius - strokeWidth / 2)
      .attr('fill', ifciuDarkTheme.colors.tertiaryBg)
      .attr('stroke', ifciuDarkTheme.colors.secondaryBg)
      .attr('stroke-width', strokeWidth);

    // Pasek progresu
    const arc = d3.arc()
      .innerRadius(radius - strokeWidth)
      .outerRadius(radius - 2)
      .startAngle(0)
      .cornerRadius(10);

    const background = g.append('path')
      .datum({ endAngle: 2 * Math.PI })
      .attr('d', arc)
      .attr('fill', ifciuDarkTheme.colors.secondaryBg);

    const foreground = g.append('path')
      .datum({ endAngle: (2 * Math.PI * value) / max })
      .attr('d', arc)
      .attr('fill', color)
      .attr('opacity', 0.8)
      .style('filter', `drop-shadow(0 0 6px ${color})`);

    // Animacja
    foreground.transition()
      .duration(1000)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate(0, d.endAngle);
        return function(t) {
          d.endAngle = interpolate(t);
          return arc(d) || '';
        };
      });

    // Tekst
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.3em')
      .attr('fill', ifciuDarkTheme.colors.textPrimary)
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .text(`${Math.round((value / max) * 100)}%`);

    if (label) {
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '2.5em')
        .attr('fill', ifciuDarkTheme.colors.textSecondary)
        .style('font-size', '12px')
        .text(label);
    }

  }, [value, max, color, radius, strokeWidth, label]);

  return (
    <div className="flex justify-center">
      <svg 
        ref={svgRef} 
        width={size} 
        height={size}
      />
    </div>
  );
};

export default EnergyRadialChart;