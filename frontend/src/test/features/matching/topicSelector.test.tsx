import React, {useState} from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import TopicSelector from '../../../features/matching/topicSelector/topicSelector';
import {TOPIC_CATEGORIES} from '../../../features/matching/constants/topicCategories';

const Wrapper = () => {
  const [selection, setSelection] = useState<string[]>([]);
  return (
    <>
      <TopicSelector currentSelection={selection} onSelectionChange={setSelection} />
      <div data-testid="selection">{selection.join(',')}</div>
    </>
  );
};

describe('features/matching/TopicSelector', () => {
  it('shows fallback message when no topics selected', () => {
    render(<Wrapper />);
    expect(
      screen.getByText(/no topics selected\. you will be matched with a question from any topic\./i),
    ).toBeInTheDocument();
  });

  it('toggles individual topic selection', () => {
    render(<Wrapper />);

    const arraysChip = screen.getAllByRole('button', {name: 'Arrays'})[0];
    fireEvent.click(arraysChip);
    expect(screen.getByTestId('selection').textContent).toContain('Arrays');

    const removeChip = screen.getAllByRole('button', {name: 'Arrays'})[0];
    fireEvent.click(removeChip);
    expect(screen.getByTestId('selection').textContent).toBe('');
  });

  it('selects and deselects entire category', () => {
    render(<Wrapper />);

    const firstCategory = TOPIC_CATEGORIES[0];
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    firstCategory.topics.forEach((topic) => {
      expect(screen.getByTestId('selection').textContent).toContain(topic);
    });

    fireEvent.click(checkbox);
    expect(screen.getByTestId('selection').textContent).toBe('');
  });
});

