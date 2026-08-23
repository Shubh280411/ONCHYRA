import { NextResponse } from 'next/server';

const PACKAGES: Record<string, { price: number; boost: number; cap: number; name: string }> = {
  starter:  { price: 5,   boost: 4,   cap: 50,   name: 'Starter' },
  builder:  { price: 10,  boost: 8,   cap: 100,  name: 'Builder' },
  pioneer:  { price: 25,  boost: 15,  cap: 250,  name: 'Pioneer' },
  elite:    { price: 50,  boost: 30,  cap: 500,  name: 'Elite' },
  titan:    { price: 100, boost: 60,  cap: 1000, name: 'Titan' },
  dominion: { price: 250, boost: 120, cap: 2500, name: 'Dominion' },
  legacy:   { price: 500, boost: 300, cap: 5000, name: 'Legacy' },
};

export async function GET() {
  return NextResponse.json(PACKAGES);
}
