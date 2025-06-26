package com.artisania.marketplace.controller;

import com.artisania.marketplace.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    /**
     * Serve uploaded files (images)
     */
    @GetMapping("/images/{category}/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String category, 
                                            @PathVariable String filename,
                                            HttpServletRequest request) {
        // Load file as Resource
        String filePath = category + "/" + filename;
        Resource resource = fileStorageService.loadFileAsResource(filePath);

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
    }

    /**
     * Serve artisan files specifically (handles legacy URL pattern)
     */
    @GetMapping("/artisans/{subfolder}/{filename:.+}")
    public ResponseEntity<Resource> serveArtisanFile(@PathVariable String subfolder,
                                                     @PathVariable String filename,
                                                     HttpServletRequest request) {
        // Load file as Resource - artisan files are stored in artisans/{subfolder}/{filename}
        String filePath = "artisans/" + subfolder + "/" + filename;
        Resource resource = fileStorageService.loadFileAsResource(filePath);

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
    }

    /**
     * Check if file exists
     */
    @GetMapping("/exists/{category}/{filename:.+}")
    public ResponseEntity<Boolean> fileExists(@PathVariable String category, 
                                             @PathVariable String filename) {
        String filePath = category + "/" + filename;
        boolean exists = fileStorageService.fileExists(filePath);
        return ResponseEntity.ok(exists);
    }

    /**
     * Health check for file storage system
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            // Check if upload directory exists and is writable
            String uploadDir = fileStorageService.getUploadDir();
            boolean directoryExists = fileStorageService.getFileStorageLocation().toFile().exists();
            boolean directoryWritable = fileStorageService.getFileStorageLocation().toFile().canWrite();
            
            health.put("status", "healthy");
            health.put("uploadDirectory", uploadDir);
            health.put("directoryExists", directoryExists);
            health.put("directoryWritable", directoryWritable);
            health.put("message", "File storage service is operational");
            
            return ResponseEntity.ok(health);
            
        } catch (Exception e) {
            health.put("status", "unhealthy");
            health.put("message", "File storage service error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(health);
        }
    }
} 