import type { Metadata } from 'next'

import { env } from '@/lib/env'

const URL = env.NEXT_PUBLIC_URL!
export const metadata: Metadata = {
  title: 'ML zu Gramm Umrechner | CalorieTracker',
  description:
    'Professioneller ML zu Gramm Umrechner für über 50 Substanzen. Konvertieren Sie einfach zwischen Millilitern und Gramm für Kochen, Backen, Labor und mehr. Kostenlos und präzise.',
  keywords: [
    'ml zu gramm umrechner',
    'milliliter gramm rechner',
    'dichte umrechnung',
    'küchen umrechner',
    'volumen gewicht konverter',
    'kochen rechner',
    'backen umrechnung',
    'flüssigkeiten wiegen',
    'honig ml gramm',
    'milch ml gramm',
    'öl ml gramm',
  ],
  authors: [{ name: 'CalorieTracker Team' }],
  creator: 'CalorieTracker',
  publisher: 'CalorieTracker',
  applicationName: 'CalorieTracker ML zu Gramm Umrechner',

  // Open Graph / Social Media
  openGraph: {
    title: 'ML zu Gramm Umrechner - Präzise Umrechnung für 50+ Substanzen',
    description:
      'Konvertieren Sie einfach zwischen Millilitern und Gramm. Über 50 Substanzen verfügbar - von Wasser bis Honig. Perfekt für Küche, Labor und Alltag.',
    type: 'website',
    locale: 'de_DE',
    url: URL,
    siteName: 'CalorieTracker',
    images: [
      {
        url: '/og-unit-converter.png', // TODO: Erstellen
        width: 1200,
        height: 630,
        alt: 'ML zu Gramm Umrechner Interface',
        type: 'image/png',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'ML zu Gramm Umrechner | CalorieTracker',
    description:
      'Präzise Umrechnung zwischen Millilitern und Gramm für 50+ Substanzen. Kostenlos und einfach zu verwenden.',
    images: ['/twitter-unit-converter.png'], // TODO: Erstellen
    creator: '@calorietracker', // TODO: Anpassen
  },

  // Structured Data
  other: {
    'application-name': 'CalorieTracker ML zu Gramm Umrechner',
    'msapplication-TileColor': '#2563eb',
    'theme-color': '#2563eb',
  },

  // Canonical URL
  alternates: {
    canonical: `${URL}/unit-converter`, // TODO: Anpassen
  },

  // Robot Instructions
  robots: {
    index: true,
    follow: true,
    googleBot: {
      'index': true,
      'follow': true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Category
  category: 'tools',
}
