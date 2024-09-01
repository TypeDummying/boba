
require 'fileutils'
require 'mini_magick'
require 'taglib'
require 'streamio-ffmpeg'

class HandledObjects
  ALLOWED_IMAGE_FORMATS = %w[.jpg .jpeg .png .gif .bmp .tiff]
  ALLOWED_AUDIO_FORMATS = %w[.mp3 .wav .ogg .flac .aac]
  ALLOWED_VIDEO_FORMATS = %w[.mp4 .avi .mov .wmv .flv .mkv]

  def initialize(input_directory, output_directory)
    @input_directory = input_directory
    @output_directory = output_directory
    FileUtils.mkdir_p(@output_directory) unless Dir.exist?(@output_directory)
  end

  def process_files
    Dir.glob(File.join(@input_directory, '**', '*')).each do |file|
      next if File.directory?(file)

      extension = File.extname(file).downcase
      if ALLOWED_IMAGE_FORMATS.include?(extension)
        process_image(file)
      elsif ALLOWED_AUDIO_FORMATS.include?(extension)
        process_audio(file)
      elsif ALLOWED_VIDEO_FORMATS.include?(extension)
        process_video(file)
      else
        puts "Skipping unsupported file: #{file}"
      end
    end
  end

  private

  def process_image(file)
    begin
      image = MiniMagick::Image.open(file)
      
      # Resize image if it's too large
      if image.width > 2000 || image.height > 2000
        image.resize "2000x2000>"
      end

      # Apply watermark
      image.combine_options do |c|
        c.gravity 'SouthEast'
        c.draw "text 10,10 'Processed'"
        c.fill 'rgba(255, 255, 255, 0.5)'
        c.pointsize 20
      end

      # Adjust color balance
      image.colorspace "sRGB"
      image.contrast
      image.brightness_contrast "10x10"

      # Save processed image
      output_file = File.join(@output_directory, File.basename(file))
      image.write(output_file)
      
      puts "Processed image: #{output_file}"
    rescue => e
      puts "Error processing image #{file}: #{e.message}"
    end
  end

  def process_audio(file)
    begin
      TagLib::MPEG::File.open(file) do |audio|
        tag = audio.id3v2_tag

        # Remove any personal information from tags
        tag.remove_frames('PRIV')
        tag.remove_frames('TXXX')

        # Add processing information
        tag.add_frame(TagLib::ID3v2::TextIdentificationFrame.new('TSSE', TagLib::String::UTF8))
        tag.frame_list('TSSE').first.text = 'Processed by HandledObjects'

        # Normalize volume
        audio.audio_properties.normalize_volume(0.9)

        # Save processed audio
        output_file = File.join(@output_directory, File.basename(file))
        audio.save(output_file)
      end

      puts "Processed audio: #{output_file}"
    rescue => e
      puts "Error processing audio #{file}: #{e.message}"
    end
  end

  def process_video(file)
    begin
      movie = FFMPEG::Movie.new(file)
      
      output_file = File.join(@output_directory, File.basename(file))
      
      # Transcode video with specific options
      options = {
        video_codec: 'libx264',
        audio_codec: 'aac',
        custom: %w(-preset slow -crf 22 -movflags +faststart)
      }

      # Add watermark
      options[:watermark] = {
        path: 'path/to/watermark.png',
        position: 'SE',
        padding_x: 10,
        padding_y: 10
      }

      # Adjust video
      options[:video_filter] = {
        contrast: '1.1',
        brightness: '0.1',
        saturation: '1.2'
      }

      # Resize if necessary
      if movie.width > 1920 || movie.height > 1080
        options[:resolution] = '1920x1080'
      end

      # Remove metadata
      options[:custom] << '-map_metadata' << '-1'

      movie.transcode(output_file, options)

      puts "Processed video: #{output_file}"
    rescue => e
      puts "Error processing video #{file}: #{e.message}"
    end
  end

  def sanitize_filename(filename)
    filename.gsub(/[^0-9A-Za-z.\-]/, '_')
  end
end

# Usage example
input_dir = '/path/to/input/directory'
output_dir = '/path/to/output/directory'

handler = HandledObjects.new(input_dir, output_dir)
handler.process_files

puts "All files processed successfully!"
