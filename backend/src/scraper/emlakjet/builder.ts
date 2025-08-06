import { BuildingAge, District, EmlakjetType, RoomType } from './types';

export class EmlakjetURLBuilder {
  private BASE_URL = 'https://www.emlakjet.com';
  private DEFAULT_PATH = '/satilik-konut';
  private district: District | null = null;
  private queryParams: Record<string, string | number | (string | number)[]> =
    {};

  constructor(private city: string = 'istanbul') {}

  private roomMap: Record<RoomType, number[]> = {
    '1+0': [1, 2],
    '1+1': [3],
    '2+1': [5],
    '3+1': [7],
    '4+1': [9],
    '4+2': [10],
    '5+1': [12],
  };

  private ageMap: Record<BuildingAge, number> = {
    '0': 1,
    '1': 2,
    '2': 3,
    '3': 4,
    '4': 5,
    '5-10': 6,
    '11-15': 7,
    '16-20': 9,
    '21+': 8,
  };

  setPrice(min: number | null, max: number | null) {
    if (min) this.queryParams['min_fiyat'] = min;
    if (max) this.queryParams['max_fiyat'] = max;
    return this;
  }

  setSize(min: number | null, max: number | null) {
    if (min) this.queryParams['min_m2'] = min;
    if (max) this.queryParams['max_m2'] = max;
    return this;
  }

  setRooms(roomList: RoomType[] | null) {
    if (roomList) {
      const mapped = roomList.flatMap((r) => this.roomMap[r] || []);
      if (mapped.length) this.queryParams['oda_sayisi'] = [...new Set(mapped)];
    }
    return this;
  }

  setBuildingAge(ageList: BuildingAge[] | null) {
    if (ageList) {
      const mapped = ageList.map((a) => this.ageMap[a]).filter(Boolean);
      if (mapped.length) this.queryParams['binanin_yasi'] = mapped;
    }
    return this;
  }

  setDistrict(district: District | null) {
    if (district) this.district = district;
    return this;
  }

  setType(type: EmlakjetType | null) {
    if (type === 'buy') {
      this.DEFAULT_PATH = '/satilik-konut';
    } else if (type === 'rent') {
      this.DEFAULT_PATH = '/kiralik-konut';
    }
    return this;
  }

  setPage(page: number | null) {
    if (page) this.queryParams['sayfa'] = page;
    return this;
  }

  build(): string {
    const basePath = `${this.BASE_URL}${this.DEFAULT_PATH}/${this.city}${
      this.district ? `-${this.district}` : ''
    }`;
    const parts: string[] = [];
    for (const [key, value] of Object.entries(this.queryParams)) {
      if (Array.isArray(value)) {
        for (const v of value) parts.push(`${key}[]=${v}`);
      } else {
        parts.push(`${key}=${value}`);
      }
    }
    const query = parts.join('&');
    return parts.length ? `${basePath}?${query}` : basePath;
  }
}
