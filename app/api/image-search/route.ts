// import { searchImages } from 'duck-duck-scrape';
// import { NextResponse } from 'next/server';

// export const runtime = 'nodejs'

// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const query = searchParams.get('query');

//   try {
//     const results = await searchImages(query);
//     const formattedResults = results.results.map(image => ({
//       title: image.title,
//       image: image.image
//     }));
//     // console.log('DuckDuckGo image search results:', formattedResults);
//     return NextResponse.json({ results: formattedResults });
//   } catch (error) {
//     console.error('DuckDuckGo image search error:', error);
//     return NextResponse.json({ error: 'Failed to perform image search' }, { status: 500 });
//   }
// }


import { searchImages, SafeSearchType } from 'duck-duck-scrape';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  try {
    const results = await searchImages(query, { safeSearch: SafeSearchType.OFF });
    const formattedResults = results.results.map(image => ({
      title: image.title,
      image: image.image
    }));
    console.log('DuckDuckGo image search results:', formattedResults);
    return NextResponse.json({ results: formattedResults });
  } catch (error) {
    console.error('DuckDuckGo image search error:', error);
    return NextResponse.json({ error: 'Failed to perform image search' }, { status: 500 });
  }
}