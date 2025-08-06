import axios from 'axios';
import {
  District,
  EmlakjetSearchResponse,
  EmlakjetPropertyType,
  EmlakjetNearbyPlacesResponse,
} from './types';

export class EmlakjetAPI {
  private baseUrl = 'https://search.emlakjet.com';
  private apiUrl = 'https://api.emlakjet.com/e6t';
  private city = 'istanbul';
  private queryParams: Record<string, string> = {
    view_type: 'map',
  };
  private body = {
    listingSelectedFields: [
      'id',
      'title',
      'imagesFullPath',
      'estateTypeName',
      'tradeTypeName',
      'roomCountName',
      'floorName',
      'squareMeter',
      'categoryTypeName',
      'priceDetail.price',
      'priceDetail.currency',
      'url',
      'phoneNumber',
      'quickInfos',
      'location.coordinate',
      'badges',
    ],
    projectSelectedFields: [
      'id',
      'name',
      'images',
      'companyName',
      'area',
      'flatCount',
      'salesStatus',
      'price',
      'url',
      'coordinates',
      'badge',
      'tags',
      'tradeType.name',
    ],
    otherFields: ['url', 'searchCriteria', 'name'],
    size: 50000,
    isProjectSearch: false,
    isListingSearch: true,
  };

  async search(
    type: EmlakjetPropertyType,
    district: District
  ): Promise<EmlakjetSearchResponse> {
    const path = `/search/v1/selection/${type}-konut/${this.city}-${district}`;
    const query = new URLSearchParams(this.queryParams).toString();

    const url = `${this.baseUrl}${path}?${query}`;
    const response = await axios.post(url, this.body);
    return response.data;
  }

  async getNearbyPlaces(id: number): Promise<EmlakjetNearbyPlacesResponse> {
    const path = `/v1/listing/${id}/nearby-poi`;
    const categories = '11,2,7,5,8';
    const limit = 3;
    const url = `${this.apiUrl}${path}?category=${categories}&limit=${limit}`;
    const response = await axios.get(url);
    return response.data;
  }
}
