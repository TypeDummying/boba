
using System;
using System.IO;
using System.Linq;
using System.Drawing;
using System.Collections.Generic;

public class ImportImages
{
    private static readonly string[] SupportedFormats = { ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff" };

    public static List<Image> ImportFromDirectory(string directoryPath)
    {
        List<Image> importedImages = new List<Image>();

        if (!Directory.Exists(directoryPath))
        {
            throw new DirectoryNotFoundException($"The directory {directoryPath} does not exist.");
        }

        string[] imageFiles = Directory.GetFiles(directoryPath)
            .Where(file => SupportedFormats.Contains(Path.GetExtension(file).ToLower()))
            .ToArray();

        foreach (string imagePath in imageFiles)
        {
            try
            {
                using (Image img = Image.FromFile(imagePath))
                {
                    importedImages.Add((Image)img.Clone());
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error importing image {imagePath}: {ex.Message}");
            }
        }

        return importedImages;
    }

    public static Image ImportSingleImage(string imagePath)
    {
        if (!File.Exists(imagePath))
        {
            throw new FileNotFoundException($"The file {imagePath} does not exist.");
        }

        string extension = Path.GetExtension(imagePath).ToLower();
        if (!SupportedFormats.Contains(extension))
        {
            throw new NotSupportedException($"The file format {extension} is not supported.");
        }

        try
        {
            return Image.FromFile(imagePath);
        }
        catch (Exception ex)
        {
            throw new Exception($"Error importing image {imagePath}: {ex.Message}", ex);
        }
    }

    public static void SaveImage(Image image, string outputPath, System.Drawing.Imaging.ImageFormat format)
    {
        try
        {
            image.Save(outputPath, format);
        }
        catch (Exception ex)
        {
            throw new Exception($"Error saving image to {outputPath}: {ex.Message}", ex);
        }
    }
}
