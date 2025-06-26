package com.artisania.marketplace.controller;

import com.artisania.marketplace.model.ArtisanProfile;
import com.artisania.marketplace.dto.CreateArtisanProfileRequest;
import com.artisania.marketplace.service.ArtisanProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/artisans")
@CrossOrigin(origins = "*")
public class ArtisanProfileController {

    @Autowired
    private ArtisanProfileService artisanProfileService;

    // Get all artisan profiles - Public access
    @GetMapping
    public ResponseEntity<List<ArtisanProfile>> getAllArtisans() {
        List<ArtisanProfile> artisans = artisanProfileService.getAllArtisanProfiles();
        return ResponseEntity.ok(artisans);
    }

    // Get artisan profile by ID - Public access
    @GetMapping("/{id}")
    public ResponseEntity<ArtisanProfile> getArtisanById(@PathVariable Long id) {
        Optional<ArtisanProfile> artisan = artisanProfileService.getArtisanProfileById(id);
        return artisan.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    // Get artisan profile by user ID - Public access
    @GetMapping("/user/{userId}")
    public ResponseEntity<ArtisanProfile> getArtisanByUserId(@PathVariable Long userId) {
        Optional<ArtisanProfile> artisan = artisanProfileService.getArtisanProfileByUserId(userId);
        return artisan.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    // Create new artisan profile - Only ARTISAN can create their own profile
    @PostMapping
    @PreAuthorize("hasRole('ARTISAN')")
    public ResponseEntity<ArtisanProfile> createArtisanProfile(@Valid @RequestBody CreateArtisanProfileRequest request) {
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

    // Update artisan profile - Owner or ADMIN
    @PutMapping("/{id}")
    @PreAuthorize("@securityService.canEditArtisanProfile(#id)")
    public ResponseEntity<ArtisanProfile> updateArtisanProfile(@PathVariable Long id, @RequestBody ArtisanProfile artisanProfile) {
        try {
            ArtisanProfile updatedProfile = artisanProfileService.updateArtisanProfile(id, artisanProfile);
            return ResponseEntity.ok(updatedProfile);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Update artisan profile image - Owner or ADMIN
    @PutMapping("/{id}/profile-image")
    @PreAuthorize("@securityService.canEditArtisanProfile(#id)")
    public ResponseEntity<ArtisanProfile> updateProfileImage(@PathVariable Long id, @RequestBody String imageUrl) {
        Optional<ArtisanProfile> profile = artisanProfileService.getArtisanProfileById(id);
        if (profile.isPresent()) {
            ArtisanProfile updatedProfile = artisanProfileService.updateProfileImage(id, imageUrl);
            return ResponseEntity.ok(updatedProfile);
        }
        return ResponseEntity.notFound().build();
    }

    // Update artisan cover image - Owner or ADMIN
    @PutMapping("/{id}/cover-image")
    @PreAuthorize("@securityService.canEditArtisanProfile(#id)")
    public ResponseEntity<ArtisanProfile> updateCoverImage(@PathVariable Long id, @RequestBody String imageUrl) {
        Optional<ArtisanProfile> profile = artisanProfileService.getArtisanProfileById(id);
        if (profile.isPresent()) {
            ArtisanProfile updatedProfile = artisanProfileService.updateCoverImage(id, imageUrl);
            return ResponseEntity.ok(updatedProfile);
        }
        return ResponseEntity.notFound().build();
    }

    // Delete artisan profile - Owner or ADMIN
    @DeleteMapping("/{id}")
    @PreAuthorize("@securityService.canEditArtisanProfile(#id)")
    public ResponseEntity<Void> deleteArtisanProfile(@PathVariable Long id) {
        Optional<ArtisanProfile> profile = artisanProfileService.getArtisanProfileById(id);
        if (profile.isPresent()) {
            artisanProfileService.deleteArtisanProfile(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Search artisans by display name - Public access
    @GetMapping("/search")
    public ResponseEntity<List<ArtisanProfile>> searchArtisansByName(@RequestParam String displayName) {
        List<ArtisanProfile> artisans = artisanProfileService.searchArtisanProfilesByDisplayName(displayName);
        return ResponseEntity.ok(artisans);
    }
} 