package com.artisania.marketplace.service;

import com.artisania.marketplace.model.Product;
import com.artisania.marketplace.model.ProductImage;
import com.artisania.marketplace.repository.ProductImageRepository;
import com.artisania.marketplace.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ProductImageService {

    private final ProductImageRepository productImageRepository;
    private final ProductRepository productRepository;

    @Autowired
    public ProductImageService(ProductImageRepository productImageRepository, 
                              ProductRepository productRepository) {
        this.productImageRepository = productImageRepository;
        this.productRepository = productRepository;
    }

    // Get all product images
    public List<ProductImage> getAllProductImages() {
        return productImageRepository.findAll();
    }

    // Get product image by ID
    public Optional<ProductImage> getProductImageById(Long id) {
        return productImageRepository.findById(id);
    }

    // Get all images for a product
    public List<ProductImage> getImagesByProduct(Product product) {
        return productImageRepository.findByProduct(product);
    }

    // Get all images for a product by product ID
    public List<ProductImage> getImagesByProductId(Long productId) {
        return productImageRepository.findByProductId(productId);
    }

    // Get primary image for a product
    public Optional<ProductImage> getPrimaryImageByProduct(Product product) {
        return productImageRepository.findByProductAndIsPrimaryTrue(product);
    }

    // Get primary image for a product by product ID
    public Optional<ProductImage> getPrimaryImageByProductId(Long productId) {
        return productImageRepository.findPrimaryImageByProductId(productId);
    }

    // Get non-primary images for a product
    public List<ProductImage> getNonPrimaryImagesByProduct(Product product) {
        return productImageRepository.findByProductAndIsPrimaryFalse(product);
    }

    // Add new product image
    public ProductImage addProductImage(ProductImage productImage) {
        // Validate product exists
        if (!productRepository.existsById(productImage.getProduct().getId())) {
            throw new RuntimeException("Product not found with id: " + productImage.getProduct().getId());
        }

        // Check for duplicate image URL for the same product
        if (productImageRepository.existsByProductAndImageUrl(productImage.getProduct(), productImage.getImageUrl())) {
            throw new IllegalArgumentException("Image URL already exists for this product");
        }

        // If this is set as primary, make sure no other image is primary for this product
        if (productImage.getIsPrimary()) {
            productImageRepository.setAllImagesAsNonPrimary(productImage.getProduct());
        }

        return productImageRepository.save(productImage);
    }

    // Add product image by product ID
    public ProductImage addProductImageByProductId(Long productId, String imageUrl, Boolean isPrimary) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
        
        ProductImage productImage = new ProductImage(product, imageUrl, isPrimary);
        return addProductImage(productImage);
    }

    // Update product image
    public ProductImage updateProductImage(Long id, ProductImage imageDetails) {
        return productImageRepository.findById(id).map(productImage -> {
            if (imageDetails.getImageUrl() != null) {
                // Check for duplicate URL for the same product (excluding current image)
                Optional<ProductImage> existingImage = productImageRepository.findByImageUrl(imageDetails.getImageUrl());
                if (existingImage.isPresent() && !existingImage.get().getId().equals(id) 
                    && existingImage.get().getProduct().equals(productImage.getProduct())) {
                    throw new IllegalArgumentException("Image URL already exists for this product");
                }
                productImage.setImageUrl(imageDetails.getImageUrl());
            }
            
            if (imageDetails.getIsPrimary() != null) {
                // If setting as primary, make sure no other image is primary for this product
                if (imageDetails.getIsPrimary()) {
                    productImageRepository.setAllImagesAsNonPrimary(productImage.getProduct());
                }
                productImage.setIsPrimary(imageDetails.getIsPrimary());
            }
            
            return productImageRepository.save(productImage);
        }).orElseThrow(() -> new RuntimeException("Product image not found with id: " + id));
    }

    // Set image as primary
    public ProductImage setAsPrimary(Long imageId) {
        return productImageRepository.findById(imageId).map(productImage -> {
            // First, set all images for this product as non-primary
            productImageRepository.setAllImagesAsNonPrimary(productImage.getProduct());
            
            // Then set this image as primary
            productImage.setIsPrimary(true);
            return productImageRepository.save(productImage);
        }).orElseThrow(() -> new RuntimeException("Product image not found with id: " + imageId));
    }

    // Set image as non-primary
    public ProductImage setAsNonPrimary(Long imageId) {
        return productImageRepository.findById(imageId).map(productImage -> {
            productImage.setIsPrimary(false);
            return productImageRepository.save(productImage);
        }).orElseThrow(() -> new RuntimeException("Product image not found with id: " + imageId));
    }

    // Delete product image
    public void deleteProductImage(Long id) {
        ProductImage productImage = productImageRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product image not found with id: " + id));
        
        boolean wasPrimary = productImage.getIsPrimary();
        Product product = productImage.getProduct();
        
        productImageRepository.deleteById(id);
        
        // If deleted image was primary, set the first remaining image as primary
        if (wasPrimary) {
            List<ProductImage> remainingImages = productImageRepository.findByProduct(product);
            if (!remainingImages.isEmpty()) {
                ProductImage firstImage = remainingImages.get(0);
                firstImage.setIsPrimary(true);
                productImageRepository.save(firstImage);
            }
        }
    }

    // Delete all images for a product
    public void deleteAllImagesByProduct(Product product) {
        productImageRepository.deleteByProduct(product);
    }

    // Delete all images for a product by product ID
    public void deleteAllImagesByProductId(Long productId) {
        productImageRepository.deleteByProductId(productId);
    }

    // Count images for a product
    public Long countImagesByProduct(Product product) {
        return productImageRepository.countImagesByProduct(product);
    }

    // Count images for a product by product ID
    public Long countImagesByProductId(Long productId) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
        return productImageRepository.countImagesByProduct(product);
    }

    // Check if image URL exists for a product
    public boolean imageUrlExistsForProduct(Product product, String imageUrl) {
        return productImageRepository.existsByProductAndImageUrl(product, imageUrl);
    }

    // Check if image URL exists for a product by product ID
    public boolean imageUrlExistsForProductId(Long productId, String imageUrl) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
        return productImageRepository.existsByProductAndImageUrl(product, imageUrl);
    }

    // Reorder images (set new primary and reorder)
    public void reorderImages(Long productId, List<Long> imageIds, Long newPrimaryImageId) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
        
        // Validate all image IDs belong to the product
        List<ProductImage> productImages = productImageRepository.findByProduct(product);
        for (Long imageId : imageIds) {
            boolean found = productImages.stream().anyMatch(img -> img.getId().equals(imageId));
            if (!found) {
                throw new IllegalArgumentException("Image with id " + imageId + " does not belong to product " + productId);
            }
        }
        
        // Set new primary image
        if (newPrimaryImageId != null) {
            setAsPrimary(newPrimaryImageId);
        }
    }

    // Get image by URL (for duplicate checking across all products)
    public Optional<ProductImage> getImageByUrl(String imageUrl) {
        return productImageRepository.findByImageUrl(imageUrl);
    }

    // Bulk add images for a product
    @Transactional
    public List<ProductImage> addMultipleImages(Long productId, List<String> imageUrls, Long primaryImageIndex) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
        
        // First, set all existing images as non-primary
        productImageRepository.setAllImagesAsNonPrimaryByProductId(productId);
        
        List<ProductImage> savedImages = new java.util.ArrayList<>();
        
        for (int i = 0; i < imageUrls.size(); i++) {
            String imageUrl = imageUrls.get(i);
            
            // Skip if URL already exists for this product
            if (productImageRepository.existsByProductAndImageUrl(product, imageUrl)) {
                continue;
            }
            
            boolean isPrimary = (primaryImageIndex != null && i == primaryImageIndex.intValue());
            ProductImage productImage = new ProductImage(product, imageUrl, isPrimary);
            savedImages.add(productImageRepository.save(productImage));
        }
        
        return savedImages;
    }
}
