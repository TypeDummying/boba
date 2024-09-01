
import React, { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { saveAs } from 'file-saver';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { getVideoTrack, getAudioTrack, getImageTrack } from './selectors/trackSelectors';
import { convertTimeToSeconds } from './utils/timeUtils';
import { compressVideo, compressAudio, resizeImage } from './utils/compressionUtils';
import { SUPPORTED_VIDEO_FORMATS, SUPPORTED_AUDIO_FORMATS, SUPPORTED_IMAGE_FORMATS } from './constants/fileFormats';
import ProgressBar from './components/ProgressBar';
import Button from './components/Button';
import Modal from './components/Modal';
import logger from './utils/logger';

const ExportVideo = () => {
  const [ffmpeg, setFfmpeg] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('mp4');
  const [exportQuality, setExportQuality] = useState('medium');
  const [exportResolution, setExportResolution] = useState('1080p');

  const videoTrack = useSelector(getVideoTrack);
  const audioTrack = useSelector(getAudioTrack);
  const imageTrack = useSelector(getImageTrack);

  const ffmpegRef = useRef(null);

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const ffmpegInstance = new FFmpeg();
        ffmpegRef.current = ffmpegInstance;
        await ffmpegInstance.load();
        setFfmpeg(ffmpegInstance);
        setIsReady(true);
        logger.info('FFmpeg loaded successfully');
      } catch (error) {
        logger.error('Failed to load FFmpeg:', error);
        toast.error('Failed to initialize video export. Please try again.');
      }
    };

    loadFFmpeg();
  }, []);

  const handleExport = async () => {
    if (!isReady || isExporting) return;

    setIsExporting(true);
    setProgress(0);

    try {
      // Prepare input files
      const videoFiles = await Promise.all(videoTrack.clips.map(clip => fetchFile(clip.url)));
      const audioFiles = await Promise.all(audioTrack.clips.map(clip => fetchFile(clip.url)));
      const imageFiles = await Promise.all(imageTrack.clips.map(clip => fetchFile(clip.url)));

      // Compress and process input files
      const processedVideoFiles = await Promise.all(videoFiles.map(file => compressVideo(file, exportQuality)));
      const processedAudioFiles = await Promise.all(audioFiles.map(file => compressAudio(file, exportQuality)));
      const processedImageFiles = await Promise.all(imageFiles.map(file => resizeImage(file, exportResolution)));

      // Generate a unique filename for the output
      const outputFilename = `boba_export_${uuidv4()}.${exportFormat}`;

      // Prepare FFmpeg command
      let command = [];

      // Add input files to the command
      processedVideoFiles.forEach((file, index) => {
        command.push('-i', `video_${index}.${SUPPORTED_VIDEO_FORMATS[0]}`);
      });
      processedAudioFiles.forEach((file, index) => {
        command.push('-i', `audio_${index}.${SUPPORTED_AUDIO_FORMATS[0]}`);
      });
      processedImageFiles.forEach((file, index) => {
        command.push('-i', `image_${index}.${SUPPORTED_IMAGE_FORMATS[0]}`);
      });

      // Add filter complex for combining video, audio, and images
      let filterComplex = '';
      let inputIndex = 0;

      // Video filters
      const videoFilters = videoTrack.clips.map((clip, index) => {
        const startTime = convertTimeToSeconds(clip.startTime);
        const duration = convertTimeToSeconds(clip.duration);
        return `[${inputIndex++}:v]trim=start=${startTime}:duration=${duration},setpts=PTS-STARTPTS[v${index}];`;
      }).join('');
      filterComplex += videoFilters;

      // Audio filters
      const audioFilters = audioTrack.clips.map((clip, index) => {
        const startTime = convertTimeToSeconds(clip.startTime);
        const duration = convertTimeToSeconds(clip.duration);
        return `[${inputIndex++}:a]atrim=start=${startTime}:duration=${duration},asetpts=PTS-STARTPTS[a${index}];`;
      }).join('');
      filterComplex += audioFilters;

      // Image filters
      const imageFilters = imageTrack.clips.map((clip, index) => {
        const startTime = convertTimeToSeconds(clip.startTime);
        const duration = convertTimeToSeconds(clip.duration);
        return `[${inputIndex++}:v]trim=start=${startTime}:duration=${duration},setpts=PTS-STARTPTS[img${index}];`;
      }).join('');
      filterComplex += imageFilters;

      // Combine video clips
      const videoCombine = videoTrack.clips.map((_, index) => `[v${index}]`).join('');
      filterComplex += `${videoCombine}concat=n=${videoTrack.clips.length}:v=1:a=0[outv];`;

      // Combine audio clips
      const audioCombine = audioTrack.clips.map((_, index) => `[a${index}]`).join('');
      filterComplex += `${audioCombine}concat=n=${audioTrack.clips.length}:v=0:a=1[outa];`;

      // Overlay images
      let lastOutput = 'outv';
      imageTrack.clips.forEach((clip, index) => {
        filterComplex += `[${lastOutput}][img${index}]overlay=shortest=1[out${index}];`;
        lastOutput = `out${index}`;
      });

      // Finalize filter complex
      filterComplex += `[${lastOutput}][outa]amerge[out]`;

      // Add filter complex to command
      command.push('-filter_complex', filterComplex);

      // Set output options
      command.push('-map', '[out]');
      command.push('-c:v', 'libx264');
      command.push('-preset', exportQuality);
      command.push('-crf', exportQuality === 'high' ? '18' : exportQuality === 'medium' ? '23' : '28');
      command.push('-c:a', 'aac');
      command.push('-b:a', '192k');
      command.push('-movflags', '+faststart');
      command.push('-y', outputFilename);

      // Execute FFmpeg command
      await ffmpeg.run(...command);

      // Read the output file
      const data = await ffmpeg.readFile(outputFilename);
      const blob = new Blob([data.buffer], { type: `video/${exportFormat}` });

      // Save the file
      saveAs(blob, outputFilename);

      setIsExporting(false);
      setProgress(100);
      toast.success('Video exported successfully!');
      logger.info('Video export completed');
    } catch (error) {
      setIsExporting(false);
      setProgress(0);
      toast.error('Failed to export video. Please try again.');
      logger.error('Video export failed:', error);
    }
  };

  const handleFormatChange = (format) => {
    setExportFormat(format);
  };

  const handleQualityChange = (quality) => {
    setExportQuality(quality);
  };

  const handleResolutionChange = (resolution) => {
    setExportResolution(resolution);
  };

  return (
    <div className="export-video-container">
      <Button
        onClick={() => setShowModal(true)}
        disabled={!isReady || isExporting}
        className="export-button"
      >
        Export Video
      </Button>
      {isExporting && <ProgressBar progress={progress} />}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Export Settings"
      >
        <div className="export-settings">
          <div className="setting">
            <label>Format:</label>
            <select value={exportFormat} onChange={(e) => handleFormatChange(e.target.value)}>
              <option value="mp4">MP4</option>
              <option value="webm">WebM</option>
              <option value="mov">MOV</option>
            </select>
          </div>
          <div className="setting">
            <label>Quality:</label>
            <select value={exportQuality} onChange={(e) => handleQualityChange(e.target.value)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="setting">
            <label>Resolution:</label>
            <select value={exportResolution} onChange={(e) => handleResolutionChange(e.target.value)}>
              <option value="2160p">4K (3840x2160)</option>
              <option value="1080p">Full HD (1920x1080)</option>
              <option value="720p">HD (1280x720)</option>
              <option value="480p">SD (854x480)</option>
            </select>
          </div>
          <Button onClick={handleExport} disabled={isExporting} className="export-confirm-button">
            {isExporting ? 'Exporting...' : 'Start Export'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ExportVideo;
