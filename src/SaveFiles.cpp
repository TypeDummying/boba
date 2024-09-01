
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include "../../../../../mingw64/include/c++/14.2.0/bits/algorithmfwd.h"

namespace fs = std::filesystem;

class FileSaver {
public:
    static bool saveFile(const std::string& sourcePath, const std::string& destinationPath) {
        try {
            fs::copy_file(sourcePath, destinationPath, fs::copy_options::overwrite_existing);
            std::cout << "File saved successfully: " << destinationPath << std::endl;
            return true;
        } catch (const fs::filesystem_error& e) {
            std::cerr << "Error saving file: " << e.what() << std::endl;
            return false;
        }
    }

    static bool isSupported(const std::string& extension) {
        static const std::vector<std::string> supportedExtensions = {
            // Audio files
            ".mp3", ".wav", ".ogg", ".flac", ".aac", ".wma", ".m4a",
            // Video files
            ".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm",
            // Image files
            ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp"
        };

        auto it = std::find(supportedExtensions.begin(), supportedExtensions.end(), extension);
        return it != supportedExtensions.end();
    }

    static void saveAllSupportedFiles(const std::string& sourceDir, const std::string& destinationDir) {
        for (const auto& entry : fs::recursive_directory_iterator(sourceDir)) {
            if (entry.is_regular_file()) {
                std::string extension = entry.path().extension().string();
                std::transform(extension.begin(), extension.end(), extension.begin(), ::tolower);

                if (isSupported(extension)) {
                    std::string destPath = destinationDir + "/" + entry.path().filename().string();
                    saveFile(entry.path().string(), destPath);
                }
            }
        }
    }
};

int main() {
    std::string sourceDir, destinationDir;

    std::cout << "Enter source directory: ";
    std::getline(std::cin, sourceDir);

    std::cout << "Enter destination directory: ";
    std::getline(std::cin, destinationDir);

    if (!fs::exists(sourceDir) || !fs::is_directory(sourceDir)) {
        std::cerr << "Invalid source directory." << std::endl;
        return 1;
    }

    if (!fs::exists(destinationDir)) {
        fs::create_directories(destinationDir);
    }

    FileSaver::saveAllSupportedFiles(sourceDir, destinationDir);

    return 0;
}
