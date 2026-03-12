// store/useCardStore.ts
// Simple in-memory store shared across tabs using React context
// Replace with AsyncStorage later for persistence

import { createContext, useContext, useState, ReactNode } from 'react';

export type OCRData = {
  names: string[];
  designations: string[];
  companies: string[];
  phones: string[];
  emails: string[];
  websites: string[];
  addresses: string[];
  pincodes: string[];
  services: string[];
  fullText: string;
};

export type Tag = 'Lead' | 'Client' | 'Partner' | 'Vendor' | 'Enterprise' | 'Startup' | 'Other';

export type ScannedCard = {
  id: string;
  uri: string;
  data: OCRData;
  tags: Tag[];
  createdAt: string; // ISO date string
  exported: boolean;
};

type CardStore = {
  cards: ScannedCard[];
  addCard: (card: ScannedCard) => void;
  deleteCard: (id: string) => void;
  updateCard: (id: string, updatedData: OCRData) => void; // Added this
  updateTags: (id: string, tags: Tag[]) => void;
  markExported: (id: string) => void;
  totalExports: number;
  weeklyScans: number;
  weeklyContacts: number;
  weeklyExports: number;
};

const CardContext = createContext<CardStore | null>(null);

const ONE_WEEK_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

export function CardProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<ScannedCard[]>([]);

  const addCard = (card: ScannedCard) => setCards((p) => [card, ...p]);
  const deleteCard = (id: string) => setCards((p) => p.filter((c) => c.id !== id));
  
  // Added updateCard function
  const updateCard = (id: string, updatedData: OCRData) =>
    setCards((p) => p.map((c) => (c.id === id ? { ...c, data: updatedData } : c)));
  
  const updateTags = (id: string, tags: Tag[]) =>
    setCards((p) => p.map((c) => (c.id === id ? { ...c, tags } : c)));
  const markExported = (id: string) =>
    setCards((p) => p.map((c) => (c.id === id ? { ...c, exported: true } : c)));

  const totalExports = cards.filter((c) => c.exported).length;
  const weeklyScans = cards.filter((c) => c.createdAt >= ONE_WEEK_AGO).length;
  const weeklyContacts = weeklyScans;
  const weeklyExports = cards.filter((c) => c.exported && c.createdAt >= ONE_WEEK_AGO).length;

  return (
    <CardContext.Provider value={{
      cards, addCard, deleteCard, updateCard, // Added updateCard here
      updateTags, markExported,
      totalExports, weeklyScans, weeklyContacts, weeklyExports,
    }}>
      {children}
    </CardContext.Provider>
  );
}

export function useCards() {
  const ctx = useContext(CardContext);
  if (!ctx) throw new Error('useCards must be used inside CardProvider');
  return ctx;
}