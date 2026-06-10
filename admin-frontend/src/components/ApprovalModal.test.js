import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ApprovalModal from './ApprovalModal';

describe('ApprovalModal Component', () => {
  const mockSubmission = {
    id: 1,
    productName: 'Test Product',
    brand: 'Test Brand',
    typeSpecifique: 'solid',
    status: 'pending',
    ocr_ingredients_text: 'Test ingredients',
    parsed_nutriments: {
      'energy-kcal_100g': 100,
    },
    found_additives: []
  };

  test('renders correctly with submission data', () => {
    render(<ApprovalModal submission={mockSubmission} onClose={() => {}} onConfirm={() => {}} loading={false} />);
    
    // Check if the modal title is rendered
    expect(screen.getByText('Validation #1')).toBeInTheDocument();
    
    // Check if input fields are pre-filled
    expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Brand')).toBeInTheDocument();
  });

  test('calls onConfirm with correct data when approved', () => {
    const handleConfirm = jest.fn();
    render(<ApprovalModal submission={mockSubmission} onClose={() => {}} onConfirm={handleConfirm} loading={false} />);
    
    const approveButton = screen.getByText('Approuver le produit');
    fireEvent.click(approveButton);
    
    expect(handleConfirm).toHaveBeenCalledWith(1, expect.objectContaining({
      product_name: 'Test Product',
      brand: 'Test Brand',
      category: 'solid',
      ingredients_text: 'Test ingredients'
    }));
  });
});
