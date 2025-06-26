package com.artisania.marketplace.controller;

import com.artisania.marketplace.service.ArtisanProfileService;
import com.artisania.marketplace.service.FileStorageService;
import com.artisania.marketplace.model.ArtisanProfile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/artisans")
public class ArtisanImageController {

    @Autowired
    private ArtisanProfileService artisanProfileService;

    @Autowired
    private FileStorageService fileStorageService;

    /**
     * Upload profile image for an artisan
     */
    @PostMapping("/{id}/profile-image")
    @PreAuthorize("hasRole('ARTISAN') or hasRole('ADMIN')")
    public ResponseEntity<?> uploadProfileImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            // Get artisan profile
            Optional<ArtisanProfile> artisanOptional = artisanProfileService.getArtisanProfileById(id);
            if (!artisanOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            ArtisanProfile artisan = artisanOptional.get();

            // Store the file
            String fileName = fileStorageService.storeFile(file, "artisans");
            
            // Update artisan profile with new image URL using FileController endpoint
            String imageUrl = "/api/files/images/artisans/" + fileName;
            artisan.setProfileImageUrl(imageUrl);
            artisanProfileService.updateArtisanProfile(id, artisan);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Profile image uploaded successfully");
            response.put("imageUrl", imageUrl);
            response.put("fileName", fileName);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to upload profile image: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Upload cover image for an artisan
     */
    @PostMapping("/{id}/cover-image")
    @PreAuthorize("hasRole('ARTISAN') or hasRole('ADMIN')")
    public ResponseEntity<?> uploadCoverImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            // Get artisan profile
            Optional<ArtisanProfile> artisanOptional = artisanProfileService.getArtisanProfileById(id);
            if (!artisanOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            ArtisanProfile artisan = artisanOptional.get();

            // Store the file
            String fileName = fileStorageService.storeFile(file, "artisans");
            
            // Update artisan profile with new cover image URL using FileController endpoint
            String imageUrl = "/api/files/images/artisans/" + fileName;
            artisan.setCoverImageUrl(imageUrl);
            artisanProfileService.updateArtisanProfile(id, artisan);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Cover image uploaded successfully");
            response.put("imageUrl", imageUrl);
            response.put("fileName", fileName);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to upload cover image: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Serve artisan images
     */
    @GetMapping("/images/{fileName:.+}")
    public ResponseEntity<Resource> serveArtisanImage(@PathVariable String fileName, HttpServletRequest request) {
        try {
            // Handle case where fileName already contains "artisans/" prefix
            String filePath;
            if (fileName.startsWith("artisans/")) {
                // fileName already has the "artisans/" prefix, use it as-is
                filePath = fileName;
            } else {
                // fileName doesn't have prefix, add it
                filePath = "artisans/" + fileName;
            }
            
            Resource resource = fileStorageService.loadFileAsResource(filePath);
            
            if (resource == null || !resource.exists()) {
                return ResponseEntity.notFound().build();
            }
            
            // Try to determine file's content type
            String contentType = null;
            try {
                contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
            } catch (IOException ex) {
                // Could not determine file type
            }
            
            // Fallback to the default content type if type could not be determined
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Delete artisan profile image
     */
    @DeleteMapping("/{id}/profile-image")
    @PreAuthorize("hasRole('ARTISAN') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteProfileImage(@PathVariable Long id) {
        try {
            Optional<ArtisanProfile> artisanOptional = artisanProfileService.getArtisanProfileById(id);
            if (!artisanOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            ArtisanProfile artisan = artisanOptional.get();

            String currentImageUrl = artisan.getProfileImageUrl();
            if (currentImageUrl != null && !currentImageUrl.isEmpty()) {
                // Extract filename from URL
                String fileName = currentImageUrl.substring(currentImageUrl.lastIndexOf("/") + 1);
                
                // Delete the file
                boolean deleted = fileStorageService.deleteFile(fileName);
                
                if (deleted) {
                    // Clear the image URL from artisan profile
                    artisan.setProfileImageUrl(null);
                    artisanProfileService.updateArtisanProfile(id, artisan);
                    
                    Map<String, String> response = new HashMap<>();
                    response.put("message", "Profile image deleted successfully");
                    return ResponseEntity.ok(response);
                } else {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "Failed to delete image file"));
                }
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "No profile image to delete"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to delete profile image: " + e.getMessage()));
        }
    }

    /**
     * Delete artisan cover image
     */
    @DeleteMapping("/{id}/cover-image")
    @PreAuthorize("hasRole('ARTISAN') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteCoverImage(@PathVariable Long id) {
        try {
            Optional<ArtisanProfile> artisanOptional = artisanProfileService.getArtisanProfileById(id);
            if (!artisanOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            ArtisanProfile artisan = artisanOptional.get();

            String currentImageUrl = artisan.getCoverImageUrl();
            if (currentImageUrl != null && !currentImageUrl.isEmpty()) {
                // Extract filename from URL
                String fileName = currentImageUrl.substring(currentImageUrl.lastIndexOf("/") + 1);
                
                // Delete the file
                boolean deleted = fileStorageService.deleteFile(fileName);
                
                if (deleted) {
                    // Clear the image URL from artisan profile
                    artisan.setCoverImageUrl(null);
                    artisanProfileService.updateArtisanProfile(id, artisan);
                    
                    Map<String, String> response = new HashMap<>();
                    response.put("message", "Cover image deleted successfully");
                    return ResponseEntity.ok(response);
                } else {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "Failed to delete image file"));
                }
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "No cover image to delete"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to delete cover image: " + e.getMessage()));
        }
    }

    /**
     * Get artisan image info
     */
    @GetMapping("/{id}/images/info")
    public ResponseEntity<?> getArtisanImageInfo(@PathVariable Long id) {
        try {
            Optional<ArtisanProfile> artisanOptional = artisanProfileService.getArtisanProfileById(id);
            if (!artisanOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            ArtisanProfile artisan = artisanOptional.get();

            Map<String, Object> imageInfo = new HashMap<>();
            imageInfo.put("profileImageUrl", artisan.getProfileImageUrl());
            imageInfo.put("coverImageUrl", artisan.getCoverImageUrl());
            imageInfo.put("hasProfileImage", artisan.getProfileImageUrl() != null && !artisan.getProfileImageUrl().isEmpty());
            imageInfo.put("hasCoverImage", artisan.getCoverImageUrl() != null && !artisan.getCoverImageUrl().isEmpty());

            return ResponseEntity.ok(imageInfo);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to get image info: " + e.getMessage()));
        }
    }

    /**
     * Health check for artisan images
     */
    @GetMapping("/images/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Artisan Image Controller");
        health.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(health);
    }
} 