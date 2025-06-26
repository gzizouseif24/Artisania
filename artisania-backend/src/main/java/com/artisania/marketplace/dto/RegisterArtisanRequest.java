package com.artisania.marketplace.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;

public class RegisterArtisanRequest {
    
    // User fields
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    private String password;
    
    // Artisan profile fields
    @NotBlank(message = "Display name is required")
    @Size(min = 2, max = 100, message = "Display name must be between 2 and 100 characters")
    private String displayName;
    
    @NotBlank(message = "Bio is required")
    @Size(min = 10, max = 1000, message = "Bio must be between 10 and 1000 characters")
    private String bio;
    
    // Optional file uploads
    private MultipartFile profileImage;
    private MultipartFile coverImage;

    // Constructors
    public RegisterArtisanRequest() {}

    public RegisterArtisanRequest(String email, String password, String displayName, String bio) {
        this.email = email;
        this.password = password;
        this.displayName = displayName;
        this.bio = bio;
    }

    // Getters and Setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

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

    public MultipartFile getProfileImage() {
        return profileImage;
    }

    public void setProfileImage(MultipartFile profileImage) {
        this.profileImage = profileImage;
    }

    public MultipartFile getCoverImage() {
        return coverImage;
    }

    public void setCoverImage(MultipartFile coverImage) {
        this.coverImage = coverImage;
    }

    @Override
    public String toString() {
        return "RegisterArtisanRequest{" +
                "email='" + email + '\'' +
                ", displayName='" + displayName + '\'' +
                ", bio='" + bio + '\'' +
                ", hasProfileImage=" + (profileImage != null && !profileImage.isEmpty()) +
                ", hasCoverImage=" + (coverImage != null && !coverImage.isEmpty()) +
                '}';
    }
} 