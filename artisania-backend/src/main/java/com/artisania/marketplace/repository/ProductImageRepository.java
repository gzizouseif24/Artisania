package com.artisania.marketplace.repository;

import com.artisania.marketplace.model.Product;
import com.artisania.marketplace.model.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    
    // Find all images for a product
    List<ProductImage> findByProduct(Product product);
    
    // Find images by product ID
    List<ProductImage> findByProductId(Long productId);
    
    // Find primary image for a product
    Optional<ProductImage> findByProductAndIsPrimaryTrue(Product product);
    
    // Find primary image by product ID
    @Query("SELECT pi FROM ProductImage pi WHERE pi.product.id = :productId AND pi.isPrimary = true")
    Optional<ProductImage> findPrimaryImageByProductId(@Param("productId") Long productId);
    
    // Find non-primary images for a product
    List<ProductImage> findByProductAndIsPrimaryFalse(Product product);
    
    // Count images for a product
    @Query("SELECT COUNT(pi) FROM ProductImage pi WHERE pi.product = :product")
    Long countImagesByProduct(@Param("product") Product product);
    
    // Set all images for a product as non-primary
    @Modifying
    @Query("UPDATE ProductImage pi SET pi.isPrimary = false WHERE pi.product = :product")
    void setAllImagesAsNonPrimary(@Param("product") Product product);
    
    // Set all images for a product ID as non-primary
    @Modifying
    @Query("UPDATE ProductImage pi SET pi.isPrimary = false WHERE pi.product.id = :productId")
    void setAllImagesAsNonPrimaryByProductId(@Param("productId") Long productId);
    
    // Delete all images for a product
    void deleteByProduct(Product product);
    
    // Delete by product ID
    void deleteByProductId(Long productId);
    
    // Find by image URL (for duplicate checking)
    Optional<ProductImage> findByImageUrl(String imageUrl);
    
    // Check if image URL exists for a product
    boolean existsByProductAndImageUrl(Product product, String imageUrl);
}
