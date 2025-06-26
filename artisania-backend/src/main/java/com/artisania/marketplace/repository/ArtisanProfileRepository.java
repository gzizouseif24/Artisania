package com.artisania.marketplace.repository;

import com.artisania.marketplace.model.ArtisanProfile;
import com.artisania.marketplace.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArtisanProfileRepository extends JpaRepository<ArtisanProfile, Long> {
    
    // Find by user
    Optional<ArtisanProfile> findByUser(User user);
    
    // Find by user ID
    Optional<ArtisanProfile> findByUserId(Long userId);
    
    // Check if profile exists for user
    boolean existsByUser(User user);
    
    // Find by display name
    Optional<ArtisanProfile> findByDisplayName(String displayName);
    
    // Search by display name containing
    List<ArtisanProfile> findByDisplayNameContainingIgnoreCase(String displayName);
    
    // Search by bio containing
    @Query("SELECT ap FROM ArtisanProfile ap WHERE ap.bio LIKE %:keyword%")
    List<ArtisanProfile> findByBioContaining(@Param("keyword") String keyword);
    
    // Find profiles with profile images
    @Query("SELECT ap FROM ArtisanProfile ap WHERE ap.profileImageUrl IS NOT NULL")
    List<ArtisanProfile> findProfilesWithImages();
    
    // Search artisan profiles by display name or bio
    @Query("SELECT ap FROM ArtisanProfile ap WHERE " +
           "ap.displayName LIKE %:keyword% OR ap.bio LIKE %:keyword%")
    List<ArtisanProfile> searchArtisanProfiles(@Param("keyword") String keyword);
} 