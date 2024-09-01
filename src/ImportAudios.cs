
using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using NAudio.Wave;
using NAudio.Vorbis;
using NAudio.Flac;

public class AudioImporter
{
    private readonly string[] supportedFormats = { ".mp3", ".wav", ".ogg", ".flac", ".aac", ".wma", ".m4a" };

    public List<AudioFile> ImportAudios(string directoryPath)
    {
        List<AudioFile> importedAudios = new List<AudioFile>();

        if (!Directory.Exists(directoryPath))
        {
            throw new DirectoryNotFoundException($"Directory not found: {directoryPath}");
        }

        string[] audioFiles = Directory.GetFiles(directoryPath)
            .Where(file => supportedFormats.Contains(Path.GetExtension(file).ToLower()))
            .ToArray();

        foreach (string filePath in audioFiles)
        {
            try
            {
                AudioFile audioFile = ImportAudio(filePath);
                importedAudios.Add(audioFile);
                Console.WriteLine($"Imported: {audioFile.FileName}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error importing {Path.GetFileName(filePath)}: {ex.Message}");
            }
        }

        return importedAudios;
    }

    private AudioFile ImportAudio(string filePath)
    {
        string extension = Path.GetExtension(filePath).ToLower();
        TimeSpan duration;
        int sampleRate;
        int channels;

        switch (extension)
        {
            case ".mp3":
                using (var reader = new Mp3FileReader(filePath))
                {
                    duration = reader.TotalTime;
                    sampleRate = reader.WaveFormat.SampleRate;
                    channels = reader.WaveFormat.Channels;
                }
                break;

            case ".wav":
                using (var reader = new WaveFileReader(filePath))
                {
                    duration = reader.TotalTime;
                    sampleRate = reader.WaveFormat.SampleRate;
                    channels = reader.WaveFormat.Channels;
                }
                break;

            case ".ogg":
                using (var reader = new VorbisWaveReader(filePath))
                {
                    duration = reader.TotalTime;
                    sampleRate = reader.WaveFormat.SampleRate;
                    channels = reader.WaveFormat.Channels;
                }
                break;

            case ".flac":
                using (var reader = new FlacReader(filePath))
                {
                    duration = reader.TotalTime;
                    sampleRate = reader.WaveFormat.SampleRate;
                    channels = reader.WaveFormat.Channels;
                }
                break;

            case ".aac":
            case ".m4a":
                using (var reader = new MediaFoundationReader(filePath))
                {
                    duration = reader.TotalTime;
                    sampleRate = reader.WaveFormat.SampleRate;
                    channels = reader.WaveFormat.Channels;
                }
                break;

            case ".wma":
                using (var reader = new WmaFileReader(filePath))
                {
                    duration = reader.TotalTime;
                    sampleRate = reader.WaveFormat.SampleRate;
                    channels = reader.WaveFormat.Channels;
                }
                break;

            default:
                throw new NotSupportedException($"Unsupported audio format: {extension}");
        }

        return new AudioFile
        {
            FileName = Path.GetFileName(filePath),
            FilePath = filePath,
            Duration = duration,
            SampleRate = sampleRate,
            Channels = channels,
            Format = extension.TrimStart('.')
        };
    }
}

public class AudioFile
{
    public string FileName { get; set; }
    public string FilePath { get; set; }
    public TimeSpan Duration { get; set; }
    public int SampleRate { get; set; }
    public int Channels { get; set; }
    public string Format { get; set; }
}
