import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BulkDeleteToolbar from '../components/BulkDeleteToolbar';

describe('BulkDeleteToolbar', () => {
  test('renders when items are selected', () => {
    render(
      <BulkDeleteToolbar
        selectedCount={3}
        onDeleteSelected={jest.fn()}
        onClearSelection={jest.fn()}
        entityType="clients"
      />
    );

    expect(screen.getByText('3 clients selected')).toBeInTheDocument();
    expect(screen.getByText('Delete Selected')).toBeInTheDocument();
    expect(screen.getByText('Clear selection')).toBeInTheDocument();
  });

  test('does not render when no items are selected', () => {
    render(
      <BulkDeleteToolbar
        selectedCount={0}
        onDeleteSelected={jest.fn()}
        onClearSelection={jest.fn()}
        entityType="clients"
      />
    );

    expect(screen.queryByText('clients selected')).not.toBeInTheDocument();
  });
});
