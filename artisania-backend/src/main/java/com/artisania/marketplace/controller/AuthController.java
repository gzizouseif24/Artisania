package com.artisania.marketplace.controller;

import com.artisania.marketplace.dto.RegisterRequest;
import com.artisania.marketplace.dto.RegisterArtisanRequest;
import com.artisania.marketplace.model.User;
import com.artisania.marketplace.service.UserService;
import com.artisania.marketplace.service.JwtService;
import com.artisania.marketplace.service.ArtisanProfileService;
import com.artisania.marketplace.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private ArtisanProfileService artisanProfileService;

    @Autowired
    private FileStorageService fileStorageService;

    // Register Customer endpoint
    @PostMapping("/register-customer")
    public ResponseEntity<?> registerCustomer(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            User user = new User();
            user.setEmail(registerRequest.getEmail());
            user.setRole(User.UserRole.CUSTOMER);
            user.setIsActive(true);
            
            User savedUser = userService.createUserWithPassword(user, registerRequest.getPassword());
            
            return ResponseEntity.ok(Map.of(
                "message", "Customer registered successfully", 
                "userId", savedUser.getId(),
                "email", savedUser.getEmail(),
                "role", savedUser.getRole()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Enhanced Register Artisan endpoint with complete file upload support
    @PostMapping(value = "/register-artisan", consumes = {"multipart/form-data"})
    public ResponseEntity<?> registerArtisan(
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("displayName") String displayName,
            @RequestParam("bio") String bio,
            @RequestParam(value = "profileImage", required = false) MultipartFile profileImage,
            @RequestParam(value = "coverImage", required = false) MultipartFile coverImage) {
        
        try {
            // Validate required fields
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            }
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));
            }
            if (displayName == null || displayName.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Display name is required"));
            }
            if (bio == null || bio.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Bio is required"));
            }
            
            // Basic validation
            if (password.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters long"));
            }
            if (!email.contains("@")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Please provide a valid email address"));
            }
            
            // Handle file uploads
            String profileImageUrl = null;
            String coverImageUrl = null;
            
            try {
                // Upload profile image if provided
                if (profileImage != null && !profileImage.isEmpty()) {
                    String profileFileName = fileStorageService.storeFile(profileImage, "artisans");
                    profileImageUrl = generateImageUrl(profileFileName);
                    System.out.println("Profile image uploaded successfully: " + profileImageUrl);
                }
                
                // Upload cover image if provided
                if (coverImage != null && !coverImage.isEmpty()) {
                    String coverFileName = fileStorageService.storeFile(coverImage, "artisans");
                    coverImageUrl = generateImageUrl(coverFileName);
                    System.out.println("Cover image uploaded successfully: " + coverImageUrl);
                }
                
            } catch (RuntimeException fileException) {
                // If file upload fails, return specific error
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "File upload failed: " + fileException.getMessage()));
            }
            
            // Register the artisan using the new service method
            ArtisanProfileService.ArtisanRegistrationResponse response = 
                artisanProfileService.registerNewArtisan(
                    email, password, displayName, bio, profileImageUrl, coverImageUrl);
            
            // Generate JWT token for immediate login
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            String jwtToken = jwtService.generateToken(userDetails);
            
            // Return enhanced response with token and full profile data
            Map<String, Object> responseMap = new HashMap<>();
            responseMap.put("message", "Artisan registered successfully");
            responseMap.put("token", jwtToken);
            
            // User info (these should never be null)
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", response.getUser().getId());
            userInfo.put("email", response.getUser().getEmail());
            userInfo.put("role", response.getUser().getRole());
            responseMap.put("user", userInfo);
            
            // Return the actual ArtisanProfile entity instead of a custom Map
            // This ensures the frontend transformer works correctly
            responseMap.put("artisanProfile", response.getArtisanProfile());
            
            // Add file upload info for debugging
            if (profileImageUrl != null || coverImageUrl != null) {
                Map<String, Object> uploadInfo = new HashMap<>();
                uploadInfo.put("profileImageUploaded", profileImageUrl != null);
                uploadInfo.put("coverImageUploaded", coverImageUrl != null);
                if (profileImageUrl != null) uploadInfo.put("profileImageUrl", profileImageUrl);
                if (coverImageUrl != null) uploadInfo.put("coverImageUrl", coverImageUrl);
                responseMap.put("uploadInfo", uploadInfo);
            }
            
            return ResponseEntity.ok(responseMap);
            
        } catch (RuntimeException e) {
            // Handle registration failures - cleanup uploaded files if any
            // Note: In a production system, you might want to implement cleanup logic here
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "An unexpected error occurred: " + e.getMessage()));
        }
    }

    // Helper method to generate proper image URL
    private String generateImageUrl(String fileName) {
        // Use the FileController endpoint format: /api/files/images/artisans/{filename}
        return "/api/files/images/artisans/" + fileName;
    }

    // Legacy Register Artisan endpoint (JSON-based, for backward compatibility)
    @PostMapping("/register-artisan-json")
    public ResponseEntity<?> registerArtisanJson(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            User user = new User();
            user.setEmail(registerRequest.getEmail());
            user.setRole(User.UserRole.ARTISAN);
            user.setIsActive(true);
            
            User savedUser = userService.createUserWithPassword(user, registerRequest.getPassword());
            
            // Create a basic artisan profile automatically
            try {
                // Extract display name from email (part before @)
                String displayName = registerRequest.getEmail().split("@")[0];
                String defaultBio = "Welcome to my artisan workshop!";
                
                artisanProfileService.createArtisanProfile(new com.artisania.marketplace.model.ArtisanProfile(
                    savedUser, displayName, defaultBio
                ));
            } catch (Exception profileException) {
                // If profile creation fails, log it but don't fail the registration
                System.err.println("Warning: Failed to create artisan profile for user " + savedUser.getEmail() + ": " + profileException.getMessage());
            }
            
            return ResponseEntity.ok(Map.of(
                "message", "Artisan registered successfully", 
                "userId", savedUser.getId(),
                "email", savedUser.getEmail(),
                "role", savedUser.getRole()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Login endpoint
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
        }

        try {
            // Authenticate the user
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
            );

            // Get user details
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            
            // Generate JWT token
            String jwtToken = jwtService.generateToken(userDetails);
            
            // Get user info
            Optional<User> userOpt = userService.getUserByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Login successful");
                response.put("token", jwtToken);
                response.put("userId", user.getId());
                response.put("email", user.getEmail());
                response.put("role", user.getRole());
                
                return ResponseEntity.ok(response);
            }
            
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication failed"));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password"));
        }
    }

    // Legacy register endpoint for backward compatibility
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        if (registerRequest.getRole() == User.UserRole.ARTISAN) {
            return registerArtisanJson(registerRequest);
        } else {
            return registerCustomer(registerRequest);
        }
    }

    // Check if email exists endpoint
    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        boolean exists = userService.emailExists(email);
        
        Map<String, Object> response = new HashMap<>();
        response.put("exists", exists);
        response.put("email", email);
        
        return ResponseEntity.ok(response);
    }
} 