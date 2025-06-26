package com.artisania.marketplace.service;

import com.artisania.marketplace.model.ArtisanProfile;
import com.artisania.marketplace.model.User;
import com.artisania.marketplace.repository.ArtisanProfileRepository;
import com.artisania.marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ArtisanProfileService {

    private final ArtisanProfileRepository artisanProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    public ArtisanProfileService(ArtisanProfileRepository artisanProfileRepository) {
        this.artisanProfileRepository = artisanProfileRepository;
    }

    /**
     * Register a new artisan with user creation and profile creation in one transaction
     * @param email User email
     * @param password User password (will be hashed)
     * @param displayName Artisan display name
     * @param bio Artisan bio
     * @param profileImageUrl Optional profile image URL
     * @param coverImageUrl Optional cover image URL
     * @return ArtisanRegistrationResponse containing user and profile data
     */
    @Transactional
    public ArtisanRegistrationResponse registerNewArtisan(
            String email, 
            String password, 
            String displayName, 
            String bio,
            String profileImageUrl,
            String coverImageUrl) {
        
        try {
            // Step 1: Create user with ARTISAN role
            User user = new User();
            user.setEmail(email);
            user.setRole(User.UserRole.ARTISAN);
            user.setIsActive(true);
            
            User savedUser = userService.createUserWithPassword(user, password);
            
            // Step 2: Create artisan profile linked to the user
            ArtisanProfile artisanProfile = new ArtisanProfile(savedUser, displayName, bio);
            
            // Set image URLs if provided
            if (profileImageUrl != null && !profileImageUrl.trim().isEmpty()) {
                artisanProfile.setProfileImageUrl(profileImageUrl);
            }
            if (coverImageUrl != null && !coverImageUrl.trim().isEmpty()) {
                artisanProfile.setCoverImageUrl(coverImageUrl);
            }
            
            ArtisanProfile savedProfile = artisanProfileRepository.save(artisanProfile);
            
            // Step 3: Return combined response
            return new ArtisanRegistrationResponse(savedUser, savedProfile);
            
        } catch (RuntimeException e) {
            // Transaction will be rolled back automatically
            throw new RuntimeException("Failed to register artisan: " + e.getMessage(), e);
        } catch (Exception e) {
            // Catch any other unexpected exceptions
            throw new RuntimeException("Unexpected error during artisan registration: " + e.getMessage(), e);
        }
    }

    /**
     * Response class for artisan registration
     */
    public static class ArtisanRegistrationResponse {
        private final User user;
        private final ArtisanProfile artisanProfile;
        
        public ArtisanRegistrationResponse(User user, ArtisanProfile artisanProfile) {
            this.user = user;
            this.artisanProfile = artisanProfile;
        }
        
        public User getUser() {
            return user;
        }
        
        public ArtisanProfile getArtisanProfile() {
            return artisanProfile;
        }
    }

    /**
     * Get the currently authenticated user
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    /**
     * Create artisan profile for the currently authenticated user
     */
    public ArtisanProfile createArtisanProfileForCurrentUser(String displayName, String bio, String profileImageUrl, String coverImageUrl) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new RuntimeException("Authentication required to create artisan profile");
        }

        // Check if user has ARTISAN role
        if (currentUser.getRole() != User.UserRole.ARTISAN) {
            throw new IllegalArgumentException("User must have ARTISAN role to create artisan profile");
        }

        // Check if profile already exists for this user
        if (artisanProfileRepository.existsByUser(currentUser)) {
            throw new IllegalArgumentException("Artisan profile already exists for user: " + currentUser.getEmail());
        }

        // Create new artisan profile
        ArtisanProfile artisanProfile = new ArtisanProfile(currentUser, displayName, bio);
        if (profileImageUrl != null) {
            artisanProfile.setProfileImageUrl(profileImageUrl);
        }
        if (coverImageUrl != null) {
            artisanProfile.setCoverImageUrl(coverImageUrl);
        }

        return artisanProfileRepository.save(artisanProfile);
    }

    // Get all artisan profiles
    public List<ArtisanProfile> getAllArtisanProfiles() {
        return artisanProfileRepository.findAll();
    }

    // Get artisan profile by ID
    public Optional<ArtisanProfile> getArtisanProfileById(Long id) {
        return artisanProfileRepository.findById(id);
    }

    // Get artisan profile by user
    public Optional<ArtisanProfile> getArtisanProfileByUser(User user) {
        return artisanProfileRepository.findByUser(user);
    }

    // Get artisan profile by user ID
    public Optional<ArtisanProfile> getArtisanProfileByUserId(Long userId) {
        return artisanProfileRepository.findByUserId(userId);
    }

    // Create new artisan profile
    public ArtisanProfile createArtisanProfile(ArtisanProfile artisanProfile) {
        // Check if profile already exists for this user
        if (artisanProfileRepository.existsByUser(artisanProfile.getUser())) {
            throw new IllegalArgumentException("Artisan profile already exists for user: " + artisanProfile.getUser().getEmail());
        }

        // Validate that user has ARTISAN role
        if (artisanProfile.getUser().getRole() != User.UserRole.ARTISAN) {
            throw new IllegalArgumentException("User must have ARTISAN role to create artisan profile");
        }

        return artisanProfileRepository.save(artisanProfile);
    }

    // Update artisan profile
    public ArtisanProfile updateArtisanProfile(Long id, ArtisanProfile profileDetails) {
        return artisanProfileRepository.findById(id).map(profile -> {
            if (profileDetails.getDisplayName() != null) {
                profile.setDisplayName(profileDetails.getDisplayName());
            }
            
            if (profileDetails.getBio() != null) {
                profile.setBio(profileDetails.getBio());
            }
            
            if (profileDetails.getProfileImageUrl() != null) {
                profile.setProfileImageUrl(profileDetails.getProfileImageUrl());
            }
            
            if (profileDetails.getCoverImageUrl() != null) {
                profile.setCoverImageUrl(profileDetails.getCoverImageUrl());
            }
            
            return artisanProfileRepository.save(profile);
        }).orElseThrow(() -> new RuntimeException("Artisan profile not found with id: " + id));
    }

    // Delete artisan profile
    public void deleteArtisanProfile(Long id) {
        if (!artisanProfileRepository.existsById(id)) {
            throw new RuntimeException("Artisan profile not found with id: " + id);
        }
        artisanProfileRepository.deleteById(id);
    }

    // Get artisan profile by display name
    public Optional<ArtisanProfile> getArtisanProfileByDisplayName(String displayName) {
        return artisanProfileRepository.findByDisplayName(displayName);
    }

    // Search artisan profiles by display name
    public List<ArtisanProfile> searchArtisanProfilesByDisplayName(String displayName) {
        return artisanProfileRepository.findByDisplayNameContainingIgnoreCase(displayName);
    }

    // Search artisan profiles by bio
    public List<ArtisanProfile> searchArtisanProfilesByBio(String keyword) {
        return artisanProfileRepository.findByBioContaining(keyword);
    }

    // Get artisan profiles with images
    public List<ArtisanProfile> getArtisanProfilesWithImages() {
        return artisanProfileRepository.findProfilesWithImages();
    }

    // Search artisan profiles
    public List<ArtisanProfile> searchArtisanProfiles(String keyword) {
        return artisanProfileRepository.searchArtisanProfiles(keyword);
    }

    // Check if profile exists for user
    public boolean profileExistsForUser(User user) {
        return artisanProfileRepository.existsByUser(user);
    }

    // Update profile image
    public ArtisanProfile updateProfileImage(Long id, String imageUrl) {
        return artisanProfileRepository.findById(id).map(profile -> {
            profile.setProfileImageUrl(imageUrl);
            return artisanProfileRepository.save(profile);
        }).orElseThrow(() -> new RuntimeException("Artisan profile not found with id: " + id));
    }

    // Update cover image
    public ArtisanProfile updateCoverImage(Long id, String imageUrl) {
        return artisanProfileRepository.findById(id).map(profile -> {
            profile.setCoverImageUrl(imageUrl);
            return artisanProfileRepository.save(profile);
        }).orElseThrow(() -> new RuntimeException("Artisan profile not found with id: " + id));
    }

    // Remove profile image
    public ArtisanProfile removeProfileImage(Long id) {
        return artisanProfileRepository.findById(id).map(profile -> {
            profile.setProfileImageUrl(null);
            return artisanProfileRepository.save(profile);
        }).orElseThrow(() -> new RuntimeException("Artisan profile not found with id: " + id));
    }

    // Remove cover image
    public ArtisanProfile removeCoverImage(Long id) {
        return artisanProfileRepository.findById(id).map(profile -> {
            profile.setCoverImageUrl(null);
            return artisanProfileRepository.save(profile);
        }).orElseThrow(() -> new RuntimeException("Artisan profile not found with id: " + id));
    }
} 