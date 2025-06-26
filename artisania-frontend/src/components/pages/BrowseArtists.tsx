import React, { useState, useEffect } from 'react';

import './BrowseArtists.css';
import { fetchArtisans } from '../../services/artisanService';
import type { FrontendArtisan } from '../../types/api';

interface BrowseArtistsProps {
  onArtistClick: (artistId: number) => void;
}

const BrowseArtists: React.FC<BrowseArtistsProps> = ({ onArtistClick }) => {
  const [artisans, setArtisans] = useState<FrontendArtisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Fetch artisans from the API
  useEffect(() => {
    const loadArtisans = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('BrowseArtists: Loading artisans...');
        const response = await fetchArtisans({
          page: 0,
          size: 20 // Load first 20 artisans
        });
        console.log('BrowseArtists: Raw artisans response:', response.content);
        response.content.forEach((artisan, index) => {
          console.log(`BrowseArtists: Artisan ${index + 1}:`, {
            id: artisan.id,
            displayName: artisan.displayName,
            profileImage: artisan.profileImage,
            bio: artisan.bio
          });
        });
        setArtisans(response.content);
      } catch (err: any) {
        console.error('Failed to load artisans:', err);
        setError('Failed to load artisans. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadArtisans();
  }, []);

  // Handle search
  const handleSearch = async (query: string) => {
    if (query.trim() === '') {
      // If search is cleared, reload all artisans
      const response = await fetchArtisans({ page: 0, size: 20 });
      setArtisans(response.content);
      return;
    }

    try {
      setLoading(true);
      const response = await fetchArtisans({
        displayName: query.trim(),
        page: 0,
        size: 20
      });
      setArtisans(response.content);
    } catch (err: any) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    
    // Debounce search - only search after user stops typing for 500ms
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleArtistClick = (artisan: FrontendArtisan) => {
    onArtistClick(artisan.id);
  };

  // Loading state
  if (loading) {
    return (
      <div className="browse-artists">
        <div className="browse-artists-container">
          <div className="browse-artists-content">
            <div className="loading-message">
              <p>Loading artisans...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="browse-artists">
        <div className="browse-artists-container">
          <div className="browse-artists-content">
            <div className="error-message">
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="retry-button"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-artists">
      <div className="browse-artists-container">
        <div className="browse-artists-content">
          {/* Search Section */}
          <div className="search-section">
            <div className="search-bar">
              <div className="search-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search for artists"
                className="search-input"
                onChange={handleSearchInputChange}
              />
            </div>
          </div>

          {/* Featured Artists Section */}
          <h3 className="section-title">Featured Artists</h3>
          
          {/* Check if we have artisans to display */}
          {artisans.length > 0 ? (
            <div className="artists-grid">
              {artisans.map((artisan) => (
                <div 
                  key={artisan.id} 
                  className="artist-card clickable"
                  onClick={() => handleArtistClick(artisan)}
                >
                  <div 
                    className="artist-image"
                    style={{ 
                      backgroundImage: artisan.profileImage === 'USE_PLACEHOLDER' 
                        ? 'none' 
                        : `url("${artisan.profileImage}")`,
                      backgroundColor: artisan.profileImage === 'USE_PLACEHOLDER' 
                        ? '#f1efe9' 
                        : 'transparent'
                    }}
                  >
                    {artisan.profileImage === 'USE_PLACEHOLDER' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: '#8e7d57',
                        fontSize: '14px',
                        fontWeight: '400',
                        textAlign: 'center',
                        padding: '1rem'
                      }}>
                        Profile Image<br />Coming Soon
                      </div>
                    )}
                  </div>
                  <div className="artist-info">
                    <p className="artist-name">{artisan.displayName}</p>
                    <p className="artist-specialty">{artisan.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-artisans-message">
              <p>No artisans available at the moment. Please check back later!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseArtists; 