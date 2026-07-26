import {
  containsWholeTerm,
  detectAllergens,
  normalizeIngredientText,
} from '../allergens';

describe('allergen detection', () => {
  it('detects French, English and Arabic labels', () => {
    expect(detectAllergens('Farine de BLÉ, beurre', ['gluten', 'lactose'])).toEqual([
      'gluten',
      'lactose',
    ]);
    expect(detectAllergens('contains peanuts and soy', ['peanuts', 'soy'])).toEqual([
      'peanuts',
      'soy',
    ]);
    expect(detectAllergens('المكونات: حليب، فول سوداني', ['lactose', 'peanuts'])).toEqual([
      'lactose',
      'peanuts',
    ]);
  });

  it('does not match terms inside another word', () => {
    const text = normalizeIngredientText('laitue et noisettine');
    expect(containsWholeTerm(text, 'lait')).toBe(false);
    expect(containsWholeTerm(text, 'noisette')).toBe(false);
  });

  it('normalizes accents and Arabic diacritics', () => {
    expect(normalizeIngredientText('BLÉ')).toBe('ble');
    expect(detectAllergens('حَلِيب', ['lactose'])).toEqual(['lactose']);
  });

  it('covers the additional regulated allergen families', () => {
    expect(
      detectAllergens(
        'céleri, moutarde, sésame, lupin, dioxyde de soufre',
        ['celery', 'mustard', 'sesame', 'lupin', 'sulphites'],
      ),
    ).toEqual(['celery', 'mustard', 'sesame', 'lupin', 'sulphites']);
    expect(
      detectAllergens(
        'المكونات: كرفس، خردل، سمسم، ترمس، كبريتيت',
        ['celery', 'mustard', 'sesame', 'lupin', 'sulphites'],
      ),
    ).toEqual(['celery', 'mustard', 'sesame', 'lupin', 'sulphites']);
  });
});
