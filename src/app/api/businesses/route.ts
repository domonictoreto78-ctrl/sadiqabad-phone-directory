import { NextRequest, NextResponse } from 'next/server';
import { getBusinesses } from '@/src/lib/supabase';
import { FilterOptions, SortOption } from '@/src/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || undefined;
    const categorySlug = searchParams.get('category') || undefined;
    const areaSlug = searchParams.get('area') || undefined;
    const openNow = searchParams.get('openNow') === 'true';
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
    const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined;
    const sort = (searchParams.get('sort') as SortOption) || 'relevance';
    const userLat = searchParams.get('lat') ? Number(searchParams.get('lat')) : undefined;
    const userLng = searchParams.get('lng') ? Number(searchParams.get('lng')) : undefined;

    const filters: FilterOptions = {
      query,
      categorySlug,
      areaSlug,
      openNow,
      verifiedOnly,
      minRating,
      sort,
      userLat,
      userLng,
    };

    const businesses = await getBusinesses(filters);

    return NextResponse.json({
      success: true,
      count: businesses.length,
      data: businesses,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch businesses',
      },
      { status: 500 }
    );
  }
}
