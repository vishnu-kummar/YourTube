// src/components/common/OnboardingModal.jsx
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';

const TAG_CATEGORIES = {
  "💻 Programming": ["programming", "javascript", "python", "webdev", "ai", "machinelearning"],
  "🎮 Gaming": ["gaming", "esports", "minecraft", "valorant"],
  "🎵 Music": ["music", "hiphop", "rock", "pop", "classical"],
  "🎬 Movies & Shows": ["movies", "bollywood", "hollywood", "anime", "documentary"],
  "⚽ Sports": ["sports", "cricket", "football", "basketball", "fitness"],
  "🍳 Food & Cooking": ["cooking", "recipes", "vegan", "baking"],
  "✈️ Travel & Vlogs": ["travel", "vlog", "adventure", "nature"],
  "✈️ News": ["news", "media", "world"],
  "✈️ Nature": ["jungle", "animal", "forest"],
  "📚 Education": ["education", "science", "history", "math","study"],
  "😂 Entertainment": ["comedy", "entertainment", "news", "tech"]
};

const OnboardingModal = ({ onComplete, onSkip }) => {
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleTag = (tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      }
      if (prev.length >= 10) {
        setError('You can select up to 10 tags');
        return prev;
      }
      setError('');
      return [...prev, tag];
    });
  };

  const handleSubmit = async () => {
    if (selectedTags.length < 3) {
      setError('Please select at least 3 tags');
      return;
    }

    setLoading(true);
    try {
      await apiService.saveUserPreferences(selectedTags);
      onComplete(selectedTags);
    } catch (err) {
      setError('Failed to save preferences. Please try again.');
      console.error('Preferences error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <div className="onboarding-header">
          <h2>🎯 Personalize Your Feed</h2>
          <p>Select topics you're interested in (at least 3)</p>
        </div>

        {error && <div className="onboarding-error">{error}</div>}

        <div className="onboarding-categories">
          {Object.entries(TAG_CATEGORIES).map(([category, tags]) => (
            <div key={category} className="tag-category">
              <h3>{category}</h3>
              <div className="tag-list">
                {tags.map(tag => (
                  <button
                    key={tag}
                    className={`tag-btn ${selectedTags.includes(tag) ? 'selected' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="onboarding-footer">
          <div className="selected-count">
            {selectedTags.length}/10 selected
          </div>
          <div className="onboarding-actions">
            <button 
              className="skip-btn"
              onClick={onSkip}
            >
              Skip for now
            </button>
            <button 
              className="continue-btn"
              onClick={handleSubmit}
              disabled={loading || selectedTags.length < 3}
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;