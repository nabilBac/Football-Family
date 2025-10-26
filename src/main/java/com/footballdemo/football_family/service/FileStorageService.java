package com.footballdemo.football_family.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path storageLocation;

   
public FileStorageService(@Value("${videos.upload.dir}") String uploadDir) throws IOException {
    this.storageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
    Files.createDirectories(this.storageLocation);
}



    public String storeFile(MultipartFile file) throws IOException {
        // Génère un nom unique pour éviter les conflits
        String extension = "";
        String originalName = file.getOriginalFilename();
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
        }
        String uniqueFileName = UUID.randomUUID().toString() + extension;

        // Transfert direct du fichier vers le disque (mémoire optimisée)
        Path targetLocation = this.storageLocation.resolve(uniqueFileName);
        file.transferTo(targetLocation);

        return uniqueFileName;
    }

    public Resource loadFileAsResource(String fileName) throws MalformedURLException {
        Path filePath = this.storageLocation.resolve(fileName).normalize();
        Resource resource = new UrlResource(filePath.toUri());

        if (resource.exists() && resource.isReadable()) {
            return resource;
        } else {
            throw new RuntimeException("Fichier introuvable ou illisible: " + fileName);
        }
    }
}
