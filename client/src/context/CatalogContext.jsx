import { createContext, useContext } from 'react';
import { useQuery } from 'react-query';
import { api } from '../services/api';

// Static fallback — used until the API responds
import {
  PLAN_CATALOG as STATIC_PLAN_CATALOG,
  COMBO_PACKAGES as STATIC_COMBOS,
  MONTHLY_PLANS as STATIC_MONTHLY,
  ADD_ONS as STATIC_ADDONS,
  CATEGORY_ORDER as STATIC_ORDER,
} from '../utils/planCatalog';

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const { data } = useQuery(
    'service-catalog',
    async () => {
      const res = await api.get('/services/catalog');
      return res.data;
    },
    { staleTime: 5 * 60 * 1000, cacheTime: 10 * 60 * 1000, retry: 2 }
  );

  return <CatalogContext.Provider value={data || null}>{children}</CatalogContext.Provider>;
}

/**
 * Hook that returns the service catalog — same shape as planCatalog.js exports.
 * Falls back to static hardcoded data while the API loads.
 */
export function useCatalog() {
  const ctx = useContext(CatalogContext);

  const PLAN_CATALOG = ctx?.planCatalog || STATIC_PLAN_CATALOG;
  const COMBO_PACKAGES = ctx?.combos || STATIC_COMBOS;
  const MONTHLY_PLANS = ctx?.monthlyPlans || STATIC_MONTHLY;
  const ADD_ONS = ctx?.addOns || STATIC_ADDONS;
  const CATEGORY_ORDER = ctx?.categoryOrder || STATIC_ORDER;

  const findPlan = (category, planSlug) => {
    const cat = PLAN_CATALOG[category];
    if (!cat) return null;
    return cat.plans.find((p) => p.slug === planSlug) || null;
  };

  const findCombo = (slug) => COMBO_PACKAGES.find((c) => c.slug === slug) || null;

  const findMonthlyPlan = (slug) => MONTHLY_PLANS.find((p) => p.slug === slug) || null;

  const getPlanSlugs = (category) => {
    const cat = PLAN_CATALOG[category];
    if (!cat) return [];
    return cat.plans.map((p) => p.slug);
  };

  return {
    PLAN_CATALOG,
    COMBO_PACKAGES,
    MONTHLY_PLANS,
    ADD_ONS,
    CATEGORY_ORDER,
    findPlan,
    findCombo,
    findMonthlyPlan,
    getPlanSlugs,
    isFromAPI: !!ctx,
  };
}
