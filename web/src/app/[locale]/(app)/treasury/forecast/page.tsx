import ForecastClient from './forecast-client';

export const metadata = {
  title: 'Prévisionnel Cash Flow | AtlasERP',
  description: 'Projection de trésorerie sur 30 jours basée sur les échéances.',
};

export default function ForecastPage() {
  return <ForecastClient />;
}
