import { searchVideos, SafeSearchType } from 'duck-duck-scrape';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  try {
    const results = await searchVideos(query, { safeSearch: SafeSearchType.OFF });
    // console.log('DuckDuckGo video search results:', results);
    return NextResponse.json(results);
  } catch (error) {
    console.error('DuckDuckGo video search error:', error);
    return NextResponse.json({ error: 'Failed to perform video search' }, { status: 500 });
  }
}