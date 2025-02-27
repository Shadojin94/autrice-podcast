import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as crypto from 'crypto';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as ffprobeInstaller from '@ffprobe-installer/ffprobe';
// Import dotenv for environment variables
// NOTE: You need to install the dotenv package first:
// npm install dotenv @types/dotenv
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Speaker {
  name: string;
  text: string;
}

@Injectable()
export class TtsService {
  private openai: OpenAI;
  private tempDir: string;

  constructor() {
    // Initialize the OpenAI client with API key from environment variables
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Set ffmpeg and ffprobe paths (can be customized via env variables)
    ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH || ffmpegInstaller.path);
    ffmpeg.setFfprobePath(process.env.FFPROBE_PATH || ffprobeInstaller.path);

    // Set temp directory (can be customized via env variables)
    this.tempDir = process.env.TEMP_DIR || path.join(process.cwd(), 'temp');
    fs.ensureDirSync(this.tempDir);
  }

  // Rest of the service implementation remains the same...
}
