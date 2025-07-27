import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useGlobalStore } from '../../../../core/state/GlobalStore';
import { ifciuDarkTheme } from '../../../../ui/themes/ifciuDark';

export const TimeHeatmap: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { tasks, habits } = useGlobalStore();

  useEffect(() => {
    if (!svgRef.current || tasks.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .html('');

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6:00 - 22:00

    // Przygotowanie danych
    const data: { day: string; hour: number; value: number }[] = [];
    
    days.forEach(day => {
      hours.forEach(hour => {
        const dayIndex = days.indexOf(day);
        const relevantTasks = tasks.filter(t => {
          if (!t.completedAt) return false;
          const date = new Date(t.completedAt);
          return date.getDay() === (dayIndex + 1) % 7 && date.getHours() === hour;
        });
        
        data.push({
          day,
          hour,
          value: relevantTasks.length
        });
      });
    });

    const x = d3.scaleBand()
      .domain(days)
      .range([margin.left, width - margin.right])
      .padding(0.05);

    const y = d3.scaleBand()
      .domain(hours.map(String))
      .range([margin.top, height - margin.bottom])
      .padding(0.05);

    const color = d3.scaleSequential()
      .domain([0, d3.max(data, d => d.value) || 1])
      .interpolator(d3.interpolateRgb(
        ifciuDarkTheme.colors.secondaryBg,
        ifciuDarkTheme.colors.accentPrimary
      ));

    // Rysowanie komórek
    svg.selectAll()
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => x(d.day)!)
      .attr('y', d => y(String(d.hour))!)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('fill', d => color(d.value))
      .attr('rx', 2)
      .attr('ry', 2)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('stroke', ifciuDarkTheme.colors.textPrimary);
        
        svg.append('text')
          .attr('class', 'tooltip')
          .attr('x', x(d.day)! + x.bandwidth() / 2)
          .attr('y', y(String(d.hour))! - 5)
          .attr('text-anchor', 'middle')
          .text(`${d.value} tasks at ${d.hour}:00 on ${d.day}`)
          .attr('fill', ifciuDarkTheme.colors.textPrimary)
          .attr('font-size', '12px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('stroke', 'none');
        svg.selectAll('.tooltip').remove();
      });

    // Osie
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('fill', ifciuDarkTheme.colors.textSecondary);

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .selectAll('text')
      .attr('fill', ifciuDarkTheme.colors.textSecondary);
  }, [tasks]);

  return (
    <div className="w-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};