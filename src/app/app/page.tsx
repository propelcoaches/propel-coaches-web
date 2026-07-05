import type { Metadata } from 'next';
import PropelAILanding from './landing';

export const metadata: Metadata = {
  title: 'Propel — One AI Coach for Every Sport You Train',
  description:
    'Strength, running, cycling, triathlon, Hyrox, combat, mobility. Propel writes the program, the meal plan, and the weekly adjustments. Launching on the App Store 3 August 2026.',
  openGraph: {
    title: 'Propel — One AI Coach for Every Sport You Train',
    description:
      'One subscription. One app. One plan that actually fits your week. Launching 3 August 2026.',
    url: 'https://app.propelcoaches.com',
    siteName: 'Propel',
  },
};

export default function Page() {
  return <PropelAILanding />;
}
