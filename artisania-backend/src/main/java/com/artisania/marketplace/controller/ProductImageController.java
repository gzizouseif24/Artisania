package com.artisania.marketplace.controller;

import com.artisania.marketplace.model.ProductImage;
import com.artisania.marketplace.service.ProductImageService;
import com.artisania.marketplace.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/product-images")
@CrossOrigin(origins = "*")
public class ProductImageController {

    @Autowired
    private ProductImageService productImageService;

    @Autowired
    private FileStorageService fileStorageService;

    // Get all images for a product - Public access
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ProductImage>> getProductImages(@PathVariable Long productId) {
        List<ProductImage> images = productImageService.getImagesByProductId(productId);
        return ResponseEntity.ok(images);
    }

    // Get image by ID - Public access
    @GetMapping("/{id}")
    public ResponseEntity<ProductImage> getProductImageById(@PathVariable Long id) {
        Optional<ProductImage> image = productImageService.getProductImageById(id);
        return image.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }

    // Add new product image - Product owner (ARTISAN) or ADMIN
    @PostMapping
    @PreAuthorize("@securityService.canCreateProductImage(#productImage.product.id)")
    public ResponseEntity<ProductImage> createProductImage(@RequestBody ProductImage productImage) {
        try {
            ProductImage savedImage = productImageService.addProductImage(productImage);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedImage);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Update product image - Product owner (ARTISAN) or ADMIN
    @PutMapping("/{id}")
    @PreAuthorize("@securityService.canEditProductImage(#id)")
    public ResponseEntity<ProductImage> updateProductImage(@PathVariable Long id, @RequestBody ProductImage productImage) {
        try {
            ProductImage updatedImage = productImageService.updateProductImage(id, productImage);
            return ResponseEntity.ok(updatedImage);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Set as primary image - Product owner (ARTISAN) or ADMIN
    @PutMapping("/{id}/primary")
    @PreAuthorize("@securityService.canEditProductImage(#id)")
    public ResponseEntity<ProductImage> setPrimaryImage(@PathVariable Long id) {
        try {
            ProductImage primaryImage = productImageService.setAsPrimary(id);
            return ResponseEntity.ok(primaryImage);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Delete product image - Product owner (ARTISAN) or ADMIN
    @DeleteMapping("/{id}")
    @PreAuthorize("@securityService.canEditProductImage(#id)")
    public ResponseEntity<Void> deleteProductImage(@PathVariable Long id) {
        try {
            productImageService.deleteProductImage(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Get primary image for a product - Public access
    @GetMapping("/product/{productId}/primary")
    public ResponseEntity<ProductImage> getPrimaryImage(@PathVariable Long productId) {
        Optional<ProductImage> image = productImageService.getPrimaryImageByProductId(productId);
        return image.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }

    // Bulk add images for a product - Product owner (ARTISAN) or ADMIN
    @PostMapping("/product/{productId}/bulk")
    @PreAuthorize("@securityService.canCreateProductImage(#productId)")
    public ResponseEntity<List<ProductImage>> addMultipleImages(
            @PathVariable Long productId, 
            @RequestBody List<String> imageUrls,
            @RequestParam(required = false) Long primaryImageIndex) {
        try {
            List<ProductImage> savedImages = productImageService.addMultipleImages(productId, imageUrls, primaryImageIndex);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedImages);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Count images for a product - Public access
    @GetMapping("/product/{productId}/count")
    public ResponseEntity<Long> countProductImages(@PathVariable Long productId) {
        Long count = productImageService.countImagesByProductId(productId);
        return ResponseEntity.ok(count);
    }

    // Delete all images for a product - Product owner (ARTISAN) or ADMIN
    @DeleteMapping("/product/{productId}")
    @PreAuthorize("@securityService.canCreateProductImage(#productId)")
    public ResponseEntity<Void> deleteAllProductImages(@PathVariable Long productId) {
        try {
            productImageService.deleteAllImagesByProductId(productId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Upload single image for a product - Product owner (ARTISAN) or ADMIN
    @PostMapping("/upload/{productId}")
    @PreAuthorize("@securityService.canCreateProductImage(#productId)")
    public ResponseEntity<Map<String, Object>> uploadProductImage(
            @PathVariable Long productId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "isPrimary", defaultValue = "false") Boolean isPrimary) {
        
        try {
            // Store the file
            String fileName = fileStorageService.storeFile(file, "products");
            
            // Create image URL
            String imageUrl = "/api/files/images/" + fileName;
            
            // Save to database
            ProductImage savedImage = productImageService.addProductImageByProductId(productId, imageUrl, isPrimary);
            
            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Image uploaded successfully");
            response.put("imageId", savedImage.getId());
            response.put("imageUrl", imageUrl);
            response.put("fileName", fileName);
            response.put("isPrimary", savedImage.getIsPrimary());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to upload image: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // Upload multiple images for a product - Product owner (ARTISAN) or ADMIN
    @PostMapping("/upload/{productId}/multiple")
    @PreAuthorize("@securityService.canCreateProductImage(#productId)")
    public ResponseEntity<Map<String, Object>> uploadMultipleProductImages(
            @PathVariable Long productId,
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "primaryIndex", defaultValue = "0") Integer primaryIndex) {
        
        try {
            List<String> imageUrls = new java.util.ArrayList<>();
            List<String> fileNames = new java.util.ArrayList<>();
            
            // Store all files
            for (MultipartFile file : files) {
                String fileName = fileStorageService.storeFile(file, "products");
                String imageUrl = "/api/files/images/" + fileName;
                imageUrls.add(imageUrl);
                fileNames.add(fileName);
            }
            
            // Save to database using bulk add
            List<ProductImage> savedImages = productImageService.addMultipleImages(
                productId, imageUrls, primaryIndex.longValue());
            
            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Images uploaded successfully");
            response.put("uploadedCount", savedImages.size());
            response.put("images", savedImages);
            response.put("fileNames", fileNames);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to upload images: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // Replace existing image with new upload - Product owner (ARTISAN) or ADMIN
    @PutMapping("/upload/{imageId}/replace")
    @PreAuthorize("@securityService.canEditProductImage(#imageId)")
    public ResponseEntity<Map<String, Object>> replaceProductImage(
            @PathVariable Long imageId,
            @RequestParam("file") MultipartFile file) {
        
        try {
            // Get existing image
            Optional<ProductImage> existingImageOpt = productImageService.getProductImageById(imageId);
            if (!existingImageOpt.isPresent()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Image not found");
                return ResponseEntity.notFound().build();
            }
            
            ProductImage existingImage = existingImageOpt.get();
            String oldImageUrl = existingImage.getImageUrl();
            
            // Store the new file
            String fileName = fileStorageService.storeFile(file, "products");
            String newImageUrl = "/api/files/images/" + fileName;
            
            // Update the image URL in database
            existingImage.setImageUrl(newImageUrl);
            ProductImage updatedImage = productImageService.updateProductImage(imageId, existingImage);
            
            // Delete old file (extract filename from URL)
            if (oldImageUrl != null && oldImageUrl.startsWith("/api/files/images/")) {
                String oldFileName = oldImageUrl.replace("/api/files/images/", "");
                fileStorageService.deleteFile(oldFileName);
            }
            
            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Image replaced successfully");
            response.put("imageId", updatedImage.getId());
            response.put("imageUrl", newImageUrl);
            response.put("fileName", fileName);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to replace image: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
} 