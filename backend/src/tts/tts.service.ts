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
   * Determine voice based on speaker ID and speaker type
   * 
   * Voix disponibles dans gpt-4o-mini-tts:
   * - alloy: Voix neutre et équilibrée
   * - echo: Voix masculine profonde et résonnante
   * - fable: Voix chaleureuse et narrative
   * - onyx: Voix masculine grave et autoritaire
   * - nova: Voix féminine claire et professionnelle
   * - shimmer: Voix féminine légère et brillante
   * - ash: Voix masculine jeune et dynamique
   * - coral: Voix féminine douce et mélodieuse
   * - sage: Voix féminine mature et posée
   * - ballad: Voix expressive et mélodique
   */
  private getVoiceForSpeaker(
    speakerId: string, 
    speakerType: string = 'default'
  ): 'alloy' | 'nova' | 'echo' | 'onyx' | 'shimmer' | 'ash' | 'coral' | 'fable' | 'sage' | 'ballad' {
    // Default mapping if no speaker type is specified
    if (speakerType === 'default') {
      return speakerId === 'R' ? 'alloy' : 'nova';
    }

    // Map speaker IDs to voices based on speaker type
    const voiceMap = {
      'homme-homme': {
        // Deux voix masculines distinctes
        'R': 'onyx' as const,  // Voix grave et autoritaire
        'S': 'echo' as const,  // Voix profonde et résonnante
      },
      'homme-femme': {
        // Une voix masculine et une voix féminine
        'R': 'ash' as const,   // Voix masculine jeune et dynamique
        'S': 'shimmer' as const, // Voix féminine légère et brillante
      },
      'femme-femme': {
        // Deux voix féminines distinctes
        'R': 'nova' as const,  // Voix féminine claire et professionnelle
        'S': 'coral' as const, // Voix féminine douce et mélodieuse
      }
    };

    // Return the appropriate voice or default to alloy/nova if not found
    if (speakerType in voiceMap && speakerId in voiceMap[speakerType as keyof typeof voiceMap]) {
      return voiceMap[speakerType as keyof typeof voiceMap][speakerId as 'R' | 'S'];
    }
    
    // Default fallback avec des voix fixes
    if (speakerId === 'R') {
      // Pour le premier intervenant (R)
      return 'onyx'; // Voix masculine grave et autoritaire
    } else {
      // Pour le second intervenant (S)
      return 'nova'; // Voix féminine claire et professionnelle
    }
  }

  /**
   * Generate speech for a single speaker line
   */
  private async generateSpeech(text: string, speakerId: string, speakerType: string = 'default'): Promise<Buffer> {
    // Choose voice based on speaker ID and type
    const voice = this.getVoiceForSpeaker(speakerId, speakerType);
    
    // Instructions de base pour la voix selon le type d'intervenant
    let baseInstructions = "";
    
    if (speakerId === 'R') {
      // Premier intervenant (R) - Plus dynamique et énergique
      baseInstructions = "Personality/affect: Un animateur radio charismatique et plein d'énergie\n\n" +
        "Voice: Enthousiaste et dynamique, avec une qualité motivante et engageante\n\n" +
        "Tone: Enjoué et expressif, avec des variations de hauteur pour maintenir l'intérêt\n\n" +
        "Intonation: Accentue certains mots clés pour l'emphase, utilise des pauses stratégiques\n\n" +
        "Speed: Parle à un rythme modérément rapide mais clair, accélère sur les moments d'excitation\n\n" +
        "Emotional range: Exprime clairement l'enthousiasme, l'humour et parfois l'ironie\n\n" +
        "Features: Utilise des expressions idiomatiques, des métaphores et des références culturelles";
    } else {
      // Second intervenant (S) - Plus posé et réfléchi
      baseInstructions = "Personality/affect: Un expert ou commentateur avec une touche d'ironie\n\n" +
        "Voice: Posée et assurée, avec une qualité légèrement sarcastique\n\n" +
        "Tone: Réfléchi mais incisif, avec des pointes d'humour sec\n\n" +
        "Intonation: Utilise des inflexions subtiles pour souligner les contradictions ou l'ironie\n\n" +
        "Speed: Parle à un rythme modéré, ralentit pour les points importants\n\n" +
        "Emotional range: Alterne entre sérieux apparent et humour pince-sans-rire\n\n" +
        "Features: Emploie des tournures élégantes et des remarques spirituelles";
    }
    
    // Instructions supplémentaires pour le style des intervenants
    const speakerStyleInstructions = "Les intervenants doivent avoir de l'humour, du sarcasme, être insolents et pleins d'esprit. " +
      "Ils doivent sembler naturels et conversationnels, comme s'ils improvisaient plutôt que de lire un texte. " +
      "Ils peuvent occasionnellement rire légèrement ou réagir aux propos de l'autre intervenant. " +
      "Le ton doit être décontracté mais intelligent, avec des variations d'intonation pour éviter la monotonie.";
    
    // Combiner les instructions
    const instructions = `${baseInstructions}\n\n${speakerStyleInstructions}`;
    
    try {
      // Utiliser le modèle gpt-4o-mini-tts avec instructions personnalisées
      const response = await this.openai.audio.speech.create({
        model: 'gpt-4o-mini-tts',
        voice: voice,
        input: text,
        // @ts-ignore - Le paramètre 'instructions' est supporté par le modèle gpt-4o-mini-tts mais pas par les types TypeScript
        instructions: instructions,
      } as any);

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
  async synthesizeSpeech(script: string, speakerType: string = 'default'): Promise<Buffer> {
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
        const audioBuffer = await this.generateSpeech(speaker.text, speaker.name, speakerType);
        
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
