package com.artisania.marketplace.service;

import com.artisania.marketplace.model.User;
import com.artisania.marketplace.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Get user by ID
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    // Get user by email
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // Create new user
    public User createUser(User user) {
        // Check if email already exists
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + user.getEmail());
        }

        // Encode password before saving
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        
        return userRepository.save(user);
    }

    // Update user
    public User updateUser(Long id, User userDetails) {
        return userRepository.findById(id).map(user -> {
            if (userDetails.getEmail() != null && !userDetails.getEmail().equals(user.getEmail())) {
                // Check if new email already exists
                if (userRepository.existsByEmail(userDetails.getEmail())) {
                    throw new IllegalArgumentException("Email already exists: " + userDetails.getEmail());
                }
                user.setEmail(userDetails.getEmail());
            }
            
            if (userDetails.getPasswordHash() != null) {
                // Encode new password before saving
                user.setPasswordHash(passwordEncoder.encode(userDetails.getPasswordHash()));
            }
            
            if (userDetails.getRole() != null) {
                user.setRole(userDetails.getRole());
            }
            
            if (userDetails.getIsActive() != null) {
                user.setIsActive(userDetails.getIsActive());
            }
            
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    // Delete user
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }

    // Activate user
    public User activateUser(Long id) {
        return userRepository.findById(id).map(user -> {
            user.setIsActive(true);
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    // Deactivate user
    public User deactivateUser(Long id) {
        return userRepository.findById(id).map(user -> {
            user.setIsActive(false);
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    // Get users by role
    public List<User> getUsersByRole(User.UserRole role) {
        return userRepository.findByRole(role);
    }

    // Get active users
    public List<User> getActiveUsers() {
        return userRepository.findByIsActiveTrue();
    }

    // Get inactive users
    public List<User> getInactiveUsers() {
        return userRepository.findByIsActiveFalse();
    }

    // Get active artisans
    public List<User> getActiveArtisans() {
        return userRepository.findActiveArtisans();
    }

    // Get active customers
    public List<User> getActiveCustomers() {
        return userRepository.findActiveCustomers();
    }

    // Search users by email pattern
    public List<User> searchUsersByEmail(String emailPattern) {
        return userRepository.findByEmailContainingAndIsActiveTrue(emailPattern);
    }

    // Check if email exists
    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    // Validate user credentials using password encoder
    public boolean validateCredentials(String email, String rawPassword) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Use password encoder to match raw password with hashed password
            return passwordEncoder.matches(rawPassword, user.getPasswordHash()) && user.getIsActive();
        }
        return false;
    }

    /**
     * Creates a new user with hashed password
     * @param user User object with basic information
     * @param password Plain text password to be hashed
     * @return Created user
     */
    public User createUserWithPassword(User user, String password) {
        // Check if email already exists
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        // Hash the password and set it
        user.setPasswordHash(passwordEncoder.encode(password));
        
        // Save the user
        return userRepository.save(user);
    }
} 