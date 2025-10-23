import React, { useState } from 'react';
import Chip from '../../../components/chip/chip';
import './topicSelector.css'

interface TopicSelectorProps {
  currentSelection: string[];
  onSelectionChange: (newSelection: string[]) => void; // Function prop
}

// dummy values
// TODO: Create an API to fetch topics from question-service db

const topicCategories = [
  {
    title: 'Core Data Structure Topics',
    topics: ['Arrays', 'Strings', 'Trees & Graphs', 'Linked Lists', 'Tries', 'Hash Maps', 'Heaps/ Priority Queues', 'Stack & Queue']
  },
  {
    title: 'Common Algorithm Topics',
    topics: ['Binary Search', 'Sorting', 'DFS/BFS', 'Two Pointers', 'Sliding Window']
  },
  {
    title: 'Advanced Techniques Topics',
    topics: ['Recursion & Backtracking', 'Dynamic Programming', 'Greedy Algorithms']
  },
  {
    title: 'Design & Architecture',
    topics: ['System Design', 'Object-Oriented Design', 'API & Database Design']
  }
];

const TopicSelector = ({ currentSelection, onSelectionChange } : TopicSelectorProps) => {

  const handleToggleTopic = (topic: string) => {
    const newSelection: string[] = currentSelection.includes(topic)
      ? currentSelection.filter(t => t != topic)
      : [...currentSelection, topic];
    onSelectionChange(newSelection); // notify parent
  };

  const handleSelectCategory = (categoryTopics: string[], checked: boolean) => {
    let newSelection: string[];
    if (checked) {
      newSelection = [...new Set([...currentSelection, ...categoryTopics])];
    } else {
      newSelection = currentSelection.filter(t => !categoryTopics.includes(t));
    }
    onSelectionChange(newSelection); // Notify parent
  };

  return (
    <div className="topic-selector">
      <div className="selected-container">
        {currentSelection.length == 0
          ? <p> No topics selected. You will be matched with a question from any topic. </p>
          : currentSelection.map(topic => (
              <Chip
                key={topic}
                label={topic}
                isSelected={true}
                onClick={() => {}}
                onRemove={() => handleToggleTopic(topic)}
              />
          ))
        }
      </div>
      <div className="selection-container">
        <div className="selection-header">
          <span>Choose Topics</span>
        </div>

        <div className="selection-content">
          {topicCategories.map(category => {
            const allInCategorySelected = category.topics.every(topic => currentSelection.includes(topic));
            return (
              <div key={category.title} className="category-section">
                <div className="category-header">
                  <input
                    type="checkbox"
                    checked={allInCategorySelected}
                    onChange={(e) => handleSelectCategory(category.topics, e.target.checked)}
                  />
                  <div className="category-title">{category.title}</div>
                </div>
                <div className="chip-group">
                  {category.topics.map(topic => (
                    <Chip
                      key={topic}
                      label={topic}
                      isSelected={currentSelection.includes(topic)}
                      onClick={() => handleToggleTopic(topic)}
                    />
                  ))}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  )

}

export default TopicSelector;