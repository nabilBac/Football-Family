package com.service;



import com.footballdemo.football_family.service.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class FileStorageServiceTest {

    private FileStorageService fileStorageService;
    private Path tempDir;

    @BeforeEach
    void setUp() throws IOException {
        // Crée un répertoire temporaire pour les tests
        tempDir = Files.createTempDirectory("test_uploads");
        fileStorageService = new FileStorageService(tempDir.toString());
    }

    @Test
    void storeFile_shouldSaveFileAndReturnUniqueName() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.txt",
                "text/plain",
                "Hello World".getBytes()
        );

        String storedFileName = fileStorageService.storeFile(file);

        // Vérifie que le fichier existe bien sur le disque
        Path storedFilePath = tempDir.resolve(storedFileName);
        assertTrue(Files.exists(storedFilePath));
        assertEquals("Hello World", Files.readString(storedFilePath));
    }

    @Test
    void loadFileAsResource_existingFile_returnsResource() throws IOException, MalformedURLException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.txt",
                "text/plain",
                "Hello World".getBytes()
        );
        String storedFileName = fileStorageService.storeFile(file);

        Resource resource = fileStorageService.loadFileAsResource(storedFileName);
        assertNotNull(resource);
        assertTrue(resource.exists());
        assertEquals("Hello World", new String(resource.getInputStream().readAllBytes()));
    }

    @Test
    void loadFileAsResource_nonExistingFile_throwsException() {
        String fakeFileName = "notfound.txt";
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> fileStorageService.loadFileAsResource(fakeFileName));

        assertTrue(exception.getMessage().contains("Fichier introuvable ou illisible"));
    }
}

