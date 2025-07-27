import React from 'react';
import { FinanceSummary } from './FinanceChart';

/**
 * Wrapper component expected by DashboardLayout.
 * Currently renders FinanceSummary (chart + stats).
 * Extend with tabs or detailed breakdown later.
 */
const FinanceOverview: React.FC = () => {
  return <FinanceSummary />;
};

export default FinanceOverview;
