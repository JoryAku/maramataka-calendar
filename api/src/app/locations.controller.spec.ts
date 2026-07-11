import { Test, TestingModule } from '@nestjs/testing';
import { LocationsController } from './locations.controller';

describe('LocationsController', () => {
  let controller: LocationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
    }).compile();

    controller = module.get<LocationsController>(LocationsController);
  });

  describe('getLocations', () => {
    it('should return all locations', () => {
      const locations = controller.getLocations();

      expect(locations.length).toBeGreaterThanOrEqual(18);
      expect(locations).toContainEqual({
        id: 'tahiti',
        name: 'Tahiti',
        timezone: 'Pacific/Tahiti',
        rohe: 'French Polynesia',
      });
      expect(locations).toContainEqual({
        id: 'wellington',
        name: 'Wellington',
        timezone: 'Pacific/Auckland',
        rohe: 'Te Whanganui-a-Tara',
      });
      expect(locations).toContainEqual({
        id: 'auckland',
        name: 'Auckland',
        timezone: 'Pacific/Auckland',
        rohe: 'Tamaki Makaurau',
      });
      expect(locations).toContainEqual({
        id: 'christchurch',
        name: 'Christchurch',
        timezone: 'Pacific/Auckland',
        rohe: 'Otautahi',
      });
      expect(locations).toContainEqual({
        id: 'gisborne',
        name: 'Gisborne',
        timezone: 'Pacific/Auckland',
        rohe: 'Turanganui-a-Kiwa',
      });
      expect(locations).toContainEqual({
        id: 'waitangi-chatham-islands',
        name: 'Waitangi, Chatham Islands',
        timezone: 'Pacific/Chatham',
        rohe: 'Rēkohu / Wharekauri',
      });
    });

    it('should return summaries without coordinates', () => {
      const locations = controller.getLocations();

      locations.forEach((location) => {
        expect(location).toHaveProperty('id');
        expect(location).toHaveProperty('name');
        expect(location).toHaveProperty('timezone');
        expect(location).toHaveProperty('rohe');
        expect(location).not.toHaveProperty('latitude');
        expect(location).not.toHaveProperty('longitude');
      });
    });
  });
});
