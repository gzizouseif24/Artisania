package com.artisania.marketplace.config;

import com.artisania.marketplace.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthFilter;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedOrigin("http://localhost:5173"); // Frontend URL
        configuration.addAllowedMethod("*"); // Allow all HTTP methods
        configuration.addAllowedHeader("*"); // Allow all headers
        configuration.setAllowCredentials(true); // Allow credentials
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        source.registerCorsConfiguration("/auth/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                // Authentication endpoints - Public
                .requestMatchers("/auth/register-customer", "/api/categories/**", "/auth/register-artisan", "/auth/login", "/auth/register", "/auth/check-email").permitAll()
                
                // Categories - GET public, CUD requires ADMIN
                .requestMatchers("POST", "/api/categories/**").hasRole("ADMIN")
                .requestMatchers("PUT", "/api/categories/**").hasRole("ADMIN")
                .requestMatchers("DELETE", "/api/categories/**").hasRole("ADMIN")
                
                // Products - GET public, POST requires ARTISAN, PUT/DELETE handled by method security
                .requestMatchers("GET", "/api/products/**").permitAll()
                .requestMatchers("POST", "/api/products").hasRole("ARTISAN")
                
                // Product Images - GET public
                .requestMatchers("GET", "/api/product-images/**").permitAll()
                
                // File serving endpoints - Public (for images, documents, etc.)
                .requestMatchers("GET", "/api/files/**").permitAll()
                
                // Artisan Profiles - GET endpoints public, others require authentication
                .requestMatchers("GET", "/api/artisans/**").permitAll()
                .requestMatchers("GET", "/api/artisan-profiles/{id}").permitAll()
                
                // Users - /me endpoints require authentication
                .requestMatchers("GET", "/api/users/me").authenticated()
                .requestMatchers("PUT", "/api/users/me").authenticated()
                .requestMatchers("/api/users/**").hasRole("ADMIN")
                
                // Cart endpoints - require authentication
                .requestMatchers("/api/cart/**").authenticated()
                
                // Orders - POST requires CUSTOMER, artisan endpoints for ARTISAN, others handled by method security
                .requestMatchers("POST", "/api/orders").hasRole("CUSTOMER")
                .requestMatchers("GET", "/api/orders/artisan").hasRole("ARTISAN")
                .requestMatchers("GET", "/api/orders/*/artisan").hasRole("ARTISAN")
                .requestMatchers("PUT", "/api/orders/*/items/*/status").hasRole("ARTISAN")
                
                // All other API endpoints require authentication
                .requestMatchers("/api/**").authenticated()
                
                // Allow all other requests
                .anyRequest().permitAll()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
} 