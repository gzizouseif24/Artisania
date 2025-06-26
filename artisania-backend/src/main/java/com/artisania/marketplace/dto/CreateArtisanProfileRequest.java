package com.artisania.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateArtisanProfileRequest {
    
    @NotBlank(message = "Display name is required")
    @Size(max = 100, message = "Display name must not exceed 100 characters")
    private String displayName;
    
    @NotBlank(message = "Bio is required")
    @Size(max = 2000, message = "Bio must not exceed 2000 characters")
    private String bio;
    
    private String profileImageUrl;
    private String coverImageUrl;
    
    // Constructors
    public CreateArtisanProfileRequest() {}
    
    public CreateArtisanProfileRequest(String displayName, String bio) {
        this.displayName = displayName;
        this.bio = bio;
    }
    
    // Getters and Setters
    public String getDisplayName() {
        return displayName;
    }
    
    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }
    
    public String getBio() {
        return bio;
    }
    
    public void setBio(String bio) {
        this.bio = bio;
    }
    
    public String getProfileImageUrl() {
        return profileImageUrl;
    }
    
    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }
    
    public String getCoverImageUrl() {
        return coverImageUrl;
    }
    
    public void setCoverImageUrl(String coverImageUrl) {
        this.coverImageUrl = coverImageUrl;
    }
} 