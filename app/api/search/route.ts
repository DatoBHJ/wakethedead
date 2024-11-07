import { search, SafeSearchType, SearchTimeType } from 'duck-duck-scrape';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs' 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const results = await search(query, 
      {
      safeSearch: SafeSearchType.OFF,
      time: SearchTimeType.YEAR 
    }
  );
    return NextResponse.json(results);
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 });
  }
}