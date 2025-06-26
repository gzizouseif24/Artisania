package com.artisania.marketplace.controller;

import com.artisania.marketplace.model.ArtisanProfile;
import com.artisania.marketplace.dto.CreateArtisanProfileRequest;
import com.artisania.marketplace.service.ArtisanProfileService;
import com.artisania.marketplace.service.FileStorageService;
import com.artisania.marketplace.service.UserService;
import com.artisania.marketplace.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserArtisanController {

    @Autowired
    private ArtisanProfileService artisanProfileService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private UserService userService;

    /**
     * Helper method to get current user's artisan profile
     */
    private Optional<ArtisanProfile> getMyArtisanProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }
        String email = authentication.getName();
        Optional<User> userOpt = userService.getUserByEmail(email);
        if (userOpt.isPresent()) {
            return artisanProfileService.getArtisanProfileByUser(userOpt.get());
        }
        return Optional.empty();
    }

    // Get current user's artisan profile
    @GetMapping("/artisan")
    @PreAuthorize("hasRole('ARTISAN')")
    public ResponseEntity<ArtisanProfile> getCurrentUserArtisanProfile() {
        try {
            Optional<ArtisanProfile> profile = getMyArtisanProfile();
            if (profile.isPresent()) {
                return ResponseEntity.ok(profile.get());
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Create artisan profile for current user
    @PostMapping("/artisan")
    @PreAuthorize("hasRole('ARTISAN')")
    public ResponseEntity<ArtisanProfile> createCurrentUserArtisanProfile(@Valid @RequestBody CreateArtisanProfileRequest request) {
        try {
            ArtisanProfile savedProfile = artisanProfileService.createArtisanProfileForCurrentUser(
                request.getDisplayName(), 
                request.getBio(),
                request.getProfileImageUrl(),
                request.getCoverImageUrl()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(savedProfile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Update current user's artisan profile
    @PutMapping("/artisan")
    @PreAuthorize("hasRole('ARTISAN')")
    public ResponseEntity<ArtisanProfile> updateCurrentUserArtisanProfile(@RequestBody ArtisanProfile artisanProfile) {
        try {
            Optional<ArtisanProfile> existingProfile = getMyArtisanProfile();
            if (existingProfile.isPresent()) {
                ArtisanProfile updatedProfile = artisanProfileService.updateArtisanProfile(
                    existingProfile.get().getId(), 
                    artisanProfile
                );
                return ResponseEntity.ok(updatedProfile);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Delete current user's artisan profile
    @DeleteMapping("/artisan")
    @PreAuthorize("hasRole('ARTISAN')")
    public ResponseEntity<Void> deleteCurrentUserArtisanProfile() {
        try {
            Optional<ArtisanProfile> existingProfile = getMyArtisanProfile();
            if (existingProfile.isPresent()) {
                artisanProfileService.deleteArtisanProfile(existingProfile.get().getId());
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Upload profile image for current user's artisan profile
     */
    @PostMapping("/profile-image")
    public ResponseEntity<Map<String, String>> uploadCurrentUserProfileImage(@RequestParam("file") MultipartFile file) {
        try {
            // Get current user's artisan profile
            Optional<ArtisanProfile> profileOpt = getMyArtisanProfile();
            if (!profileOpt.isPresent()) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Artisan profile not found");
                return ResponseEntity.notFound().build();
            }
            
            ArtisanProfile profile = profileOpt.get();
            
            // Store the file
            String fileName = fileStorageService.storeFile(file, "artisans");
            
            // Update artisan profile with new image URL using FileController endpoint
            String imageUrl = "/api/files/images/artisans/" + fileName;
            
            // Update artisan profile with new profile image URL
            artisanProfileService.updateProfileImage(profile.getId(), imageUrl);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Profile image uploaded successfully");
            response.put("imageUrl", imageUrl);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to upload profile image: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Upload cover image for current user's artisan profile
     */
    @PostMapping("/cover-image")
    public ResponseEntity<Map<String, String>> uploadCurrentUserCoverImage(@RequestParam("file") MultipartFile file) {
        try {
            // Get current user's artisan profile
            Optional<ArtisanProfile> profileOpt = getMyArtisanProfile();
            if (!profileOpt.isPresent()) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Artisan profile not found");
                return ResponseEntity.notFound().build();
            }
            
            ArtisanProfile profile = profileOpt.get();
            
            // Store the file
            String fileName = fileStorageService.storeFile(file, "artisans");
            
            // Update artisan profile with new image URL using FileController endpoint
            String imageUrl = "/api/files/images/artisans/" + fileName;
            
            // Update artisan profile with new cover image URL
            artisanProfileService.updateCoverImage(profile.getId(), imageUrl);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Cover image uploaded successfully");
            response.put("imageUrl", imageUrl);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to upload cover image: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
} 