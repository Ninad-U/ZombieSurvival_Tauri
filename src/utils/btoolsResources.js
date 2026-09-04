// src/utils/btoolsResources.js
// Resource definitions for BTOOLS with hierarchical categories

export const btoolsResources = {
  // MAP / ENVIRONMENT - These are TERRAIN resources that modify layers.ground
  environment: {
    id: 'environment',
    label: 'MAP / ENVIRONMENT',
    resources: [
      {
        id: 'grass',
        name: 'Grass',
        category: ['ground', 'grass'],
        type: 'terrain',  // MUST be 'terrain' so the panel knows it's terrain
        tileValue: 0,
        color: '#3a7a3a',
        // No asset - rendered procedurally by the game
      },
      {
        id: 'dirt',
        name: 'Dirt',
        category: ['ground', 'dirt'],
        type: 'terrain',
        tileValue: 1,
        color: '#8b7355',
      },
      {
        id: 'stone',
        name: 'Stone',
        category: ['ground', 'stone'],
        type: 'terrain',
        tileValue: 2,
        color: '#6b6b6b',
      },
      {
        id: 'water',
        name: 'Water',
        category: ['ground', 'water'],
        type: 'terrain',
        tileValue: 3,
        color: '#2a6b8a',
      },
      {
        id: 'sand',
        name: 'Sand',
        category: ['ground', 'sand'],
        type: 'terrain',
        tileValue: 4,
        color: '#c4b070',
      },
      {
        id: 'wood_floor',
        name: 'Wood Floor',
        category: ['ground', 'wood'],
        type: 'terrain',
        tileValue: 5,
        color: '#8b6b3a',
      }
    ]
  },
  
  // OBJECTS - These are actual entities with sprite assets
  objects: {
    id: 'objects',
    label: 'OBJECTS',
    resources: [
      {
        id: 'crate',
        name: 'Crate',
        category: ['containers', 'crates'],
        asset: 'objects/containers/crate.png',
        type: 'object',
        width: 32,
        height: 32,
        template: 'crate'
      },
      {
        id: 'barrel',
        name: 'Barrel',
        category: ['containers', 'barrels'],
        asset: 'objects/containers/crate.png',
        type: 'object',
        width: 24,
        height: 32,
        template: 'barrel'
      },
      {
        id: 'door',
        name: 'Door',
        category: ['doors', 'wooden'],
        asset: 'objects/furniture/door.png',
        type: 'object',
        width: 32,
        height: 48,
        template: 'door'
      },
      {
        id: 'bed',
        name: 'Bed',
        category: ['furniture', 'beds'],
        asset: 'objects/furniture/bed.png',
        type: 'object',
        width: 48,
        height: 32,
        template: 'bed'
      },
      {
        id: 'tree',
        name: 'Tree',
        category: ['nature', 'trees'],
        asset: 'objects/nature/tree.png',
        type: 'object',
        width: 32,
        height: 48,
        template: 'tree'
      },
      {
        id: 'rock',
        name: 'Rock',
        category: ['nature', 'rocks'],
        asset: 'objects/nature/rock.png',
        type: 'object',
        width: 32,
        height: 24,
        template: 'rock'
      }
    ]
  }
};

// Helper to get all categories from a section
export function getCategoriesForSection(sectionId) {
  const section = btoolsResources[sectionId];
  if (!section) return ['All'];
  
  const categories = new Set();
  categories.add('All');
  
  for (const resource of section.resources) {
    if (resource.category && resource.category.length > 0) {
      categories.add(resource.category[0]);
    }
  }
  
  return Array.from(categories);
}

// Helper to get resources filtered by category
export function getResourcesByCategory(sectionId, category) {
  const section = btoolsResources[sectionId];
  if (!section) return [];
  
  if (category === 'All' || !category) {
    return section.resources;
  }
  
  return section.resources.filter(resource => {
    return resource.category && resource.category[0] === category;
  });
}

// Helper to get full category path for display
export function getCategoryPath(resource) {
  if (!resource.category) return '';
  return resource.category.join(' › ');
}