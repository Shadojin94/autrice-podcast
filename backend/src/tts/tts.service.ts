import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as crypto from 'crypto';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as ffprobeInstaller from '@ffprobe-installer/ffprobe';

interface Speaker {
  name: string;
  text: string;
}

@Injectable()
export class TtsService {
  private openai: OpenAI;
  private tempDir: string;

  constructor() {
    // Initialize the OpenAI client with API key
    this.openai = new OpenAI({
      apiKey: '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',
    });

    // Set ffmpeg and ffprobe paths
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
    ffmpeg.setFfprobePath(ffprobeInstaller.path);

    // Set temp directory
    this.tempDir = path.join(process.cwd(), 'temp');
    fs.ensureDirSync(this.tempDir);
  }

  /**
   * Parse the input script to extract speakers and their lines
   * Expected format: "Speaker X: Text goes here"
   */
  private parseScript(script: string): Speaker[] {
    const lines = script.split('\n').filter(line => line.trim() !== '');
    const speakers: Speaker[] = [];

    for (const line of lines) {
      const match = line.match(/^Speaker\s+([A-Za-z0-9]+):\s*(.*)/);
      if (match) {
        speakers.push({
          name: match[1],
          text: match[2].trim(),
        });
      }
    }

    return speakers;
  }

  /**
   * Generate speech for a single speaker line
   */
  private async generateSpeech(text: string, speakerId: string): Promise<Buffer> {
    // Choose voice based on speaker ID
    // We'll use different voices for different speakers
    const voice = speakerId === 'R' ? 'alloy' : 'nova';
    
    try {
      const response = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: text,
      });

      // Convert the response to a buffer
      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;
    } catch (error) {
      console.error(`Error generating speech for speaker ${speakerId}:`, error);
      throw error;
    }
  }

  /**
   * Combine multiple audio files into a single file
   */
  private async combineAudioFiles(filePaths: string[]): Promise<string> {
    const outputPath = path.join(this.tempDir, `combined_${crypto.randomBytes(8).toString('hex')}.mp3`);
    
    return new Promise((resolve, reject) => {
      // Create ffmpeg command
      const command = ffmpeg();
      
      // Add input files
      filePaths.forEach(filePath => {
        command.input(filePath);
      });
      
      // Set output options and save
      command
        .on('error', (err) => {
          console.error('Error combining audio files:', err);
          reject(err);
        })
        .on('end', () => {
          resolve(outputPath);
        })
        .mergeToFile(outputPath, this.tempDir);
    });
  }

  /**
   * Clean up temporary files
   */
  private async cleanupTempFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fs.remove(filePath);
      } catch (error) {
        console.error(`Error removing temp file ${filePath}:`, error);
      }
    }
  }

  /**
   * Synthesize speech from the provided script
   */
  async synthesizeSpeech(script: string): Promise<Buffer> {
    // Parse the script to extract speakers and their lines
    const speakers = this.parseScript(script);

    if (speakers.length === 0) {
      throw new Error('No valid speaker lines found in the script');
    }

    const tempFiles: string[] = [];
    
    try {
      // Generate speech for each speaker line
      for (let i = 0; i < speakers.length; i++) {
        const speaker = speakers[i];
        const audioBuffer = await this.generateSpeech(speaker.text, speaker.name);
        
        // Save to temporary file
        const tempFilePath = path.join(this.tempDir, `speaker_${speaker.name}_${i}_${crypto.randomBytes(4).toString('hex')}.mp3`);
        await fs.writeFile(tempFilePath, audioBuffer);
        tempFiles.push(tempFilePath);
      }
      
      // Combine all audio files
      const combinedFilePath = await this.combineAudioFiles(tempFiles);
      tempFiles.push(combinedFilePath);
      
      // Read the combined file
      const combinedAudio = await fs.readFile(combinedFilePath);
      
      // Clean up temp files
      this.cleanupTempFiles(tempFiles).catch(console.error);
      
      return combinedAudio;
    } catch (error) {
      // Clean up temp files in case of error
      this.cleanupTempFiles(tempFiles).catch(console.error);
      throw error;
    }
  }
}
