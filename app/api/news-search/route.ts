import { searchNews, SafeSearchType } from 'duck-duck-scrape';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const results = await searchNews(query, {
      safeSearch: SafeSearchType.OFF
    });
    return NextResponse.json(results);
  } catch (error) {
    console.error('DuckDuckGo news search error:', error);
    return NextResponse.json({ error: 'Failed to perform news search' }, { status: 500 });
  }
}