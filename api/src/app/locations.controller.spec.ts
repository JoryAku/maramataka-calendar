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

      expect(locations).toHaveLength(4);
      expect(locations).toContainEqual({
        id: 'wellington',
        name: 'Wellington',
      });
      expect(locations).toContainEqual({
        id: 'auckland',
        name: 'Auckland',
      });
      expect(locations).toContainEqual({
        id: 'christchurch',
        name: 'Christchurch',
      });
      expect(locations).toContainEqual({
        id: 'gisborne',
        name: 'Gisborne',
      });
    });

    it('should return summaries without coordinates', () => {
      const locations = controller.getLocations();

      locations.forEach((location) => {
        expect(location).toHaveProperty('id');
        expect(location).toHaveProperty('name');
        expect(location).not.toHaveProperty('latitude');
        expect(location).not.toHaveProperty('longitude');
        expect(location).not.toHaveProperty('timezone');
      });
    });
  });
});
