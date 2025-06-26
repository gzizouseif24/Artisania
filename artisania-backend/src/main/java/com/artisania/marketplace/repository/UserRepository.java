package com.artisania.marketplace.repository;

import com.artisania.marketplace.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Find by email (for login)
    Optional<User> findByEmail(String email);
    
    // Check if email exists
    boolean existsByEmail(String email);
    
    // Find by role
    List<User> findByRole(User.UserRole role);
    
    // Find active users
    List<User> findByIsActiveTrue();
    
    // Find inactive users
    List<User> findByIsActiveFalse();
    
    // Find artisans (users with artisan role)
    @Query("SELECT u FROM User u WHERE u.role = 'ARTISAN' AND u.isActive = true")
    List<User> findActiveArtisans();
    
    // Find customers (users with customer role)
    @Query("SELECT u FROM User u WHERE u.role = 'CUSTOMER' AND u.isActive = true")
    List<User> findActiveCustomers();
    
    // Search users by email pattern
    @Query("SELECT u FROM User u WHERE u.email LIKE %:emailPattern% AND u.isActive = true")
    List<User> findByEmailContainingAndIsActiveTrue(@Param("emailPattern") String emailPattern);
} 