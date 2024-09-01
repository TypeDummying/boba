
using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;

public class ImportVideos
{
    private static readonly string[] SupportedFormats = { ".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv" };

    public static async Task<List<string>> ImportVideosFromDirectory(string directoryPath)
    {
        List<string> importedVideos = new List<string>();

        if (!Directory.Exists(directoryPath))
        {
            Console.WriteLine($"Directory not found: {directoryPath}");
            return importedVideos;
        }

        try
        {
            string[] videoFiles = Directory.GetFiles(directoryPath)
                .Where(file => SupportedFormats.Contains(Path.GetExtension(file).ToLower()))
                .ToArray();

            foreach (string videoFile in videoFiles)
            {
                string fileName = Path.GetFileName(videoFile);
                Console.WriteLine($"Importing: {fileName}");

                await ImportVideoAsync(videoFile);
                importedVideos.Add(fileName);
            }

            Console.WriteLine($"Successfully imported {importedVideos.Count} videos.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"An error occurred while importing videos: {ex.Message}");
        }

        return importedVideos;
    }

    private static async Task ImportVideoAsync(string filePath)
    {
        // Simulating an asynchronous import process
        await Task.Delay(1000);

        // Here you would typically add code to:
        // 1. Copy the file to a destination folder
        // 2. Create a database entry for the video
        // 3. Generate thumbnails or additional metadata

        Console.WriteLine($"Video imported: {Path.GetFileName(filePath)}");
    }

    public static void Main(string[] args)
    {
        if (args.Length == 0)
        {
            Console.WriteLine("Please provide a directory path as an argument.");
            return;
        }

        string directoryPath = args[0];
        List<string> importedVideos = ImportVideosFromDirectory(directoryPath).Result;

        Console.WriteLine($"Total videos imported: {importedVideos.Count}");
    }
}
