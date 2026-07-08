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

      expect(locations.length).toBeGreaterThanOrEqual(17);
      expect(locations).toContainEqual({
        id: 'wellington',
        name: 'Wellington',
        rohe: 'Te Whanganui-a-Tara',
      });
      expect(locations).toContainEqual({
        id: 'auckland',
        name: 'Auckland',
        rohe: 'Tamaki Makaurau',
      });
      expect(locations).toContainEqual({
        id: 'christchurch',
        name: 'Christchurch',
        rohe: 'Otautahi',
      });
      expect(locations).toContainEqual({
        id: 'gisborne',
        name: 'Gisborne',
        rohe: 'Turanganui-a-Kiwa',
      });
      expect(locations).toContainEqual({
        id: 'waitangi-chatham-islands',
        name: 'Waitangi, Chatham Islands',
        rohe: 'Rēkohu / Wharekauri',
      });
    });

    it('should return summaries without coordinates', () => {
      const locations = controller.getLocations();

      locations.forEach((location) => {
        expect(location).toHaveProperty('id');
        expect(location).toHaveProperty('name');
        expect(location).toHaveProperty('rohe');
        expect(location).not.toHaveProperty('latitude');
        expect(location).not.toHaveProperty('longitude');
        expect(location).not.toHaveProperty('timezone');
      });
    });
  });
});
