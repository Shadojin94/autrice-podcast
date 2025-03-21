import { Body, Controller, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'fs';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { Response } from 'express';
import { TtsService } from './tts.service';
import { OpenAI } from 'openai';

interface SynthesizeDto {
  script?: string;
  speakerType?: string;
  language?: string;
  topic?: string;
  regenerateScript?: boolean;
}

@Controller('tts')
export class TtsController {
  private openai: OpenAI;

  constructor(private readonly ttsService: TtsService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  @Post('generate-script')
  async generateScript(@Body() payload: SynthesizeDto) {
    try {
      if (!payload.topic) {
        throw new Error('Le sujet du podcast est requis');
      }

      const language = payload.language || 'Français';
      const speakerType = payload.speakerType || 'Homme & Homme';

      // Construire le prompt pour GPT-4o avec un exemple strict à suivre
      const prompt = `Génère un script de podcast sur le sujet "${payload.topic}" avec deux intervenants (Speaker R et Speaker S).
      
Le script doit suivre cette structure:
1. Introduction et présentation du sujet
2. Contexte et mise en place
3. Questions d'analyse et d'impact
4. Étude de cas ou exemple concret
5. Conclusion et récapitulatif

Format requis TRÈS IMPORTANT:
- Chaque ligne de dialogue DOIT STRICTEMENT commencer par "Speaker R:" ou "Speaker S:" (avec un espace après les deux points)
- Alterne entre les deux intervenants
- Le script doit être en ${language}
- Adapte le style pour des intervenants de type "${speakerType}"
- Les intervenants doivent avoir de l'humour, du sarcasme, être insolents et pleins d'esprit
- Utilise un ton enthousiaste, enjoué, avec une qualité motivante
- Longueur: environ 15-20 échanges au total

Voici un exemple du format EXACT à suivre:

Speaker R: Bonjour à tous et bienvenue dans ce nouvel épisode de notre podcast. Aujourd'hui, nous allons parler de l'intelligence artificielle, un sujet fascinant qui mérite d'être exploré en profondeur.
Speaker S: Tout à fait ! Ce sujet est particulièrement d'actualité et suscite beaucoup d'intérêt. Nous allons vous présenter les différents aspects et enjeux liés à l'intelligence artificielle.
Speaker R: Pour commencer, mettons en contexte ce sujet. L'intelligence artificielle est un domaine qui touche de nombreux aspects de notre société moderne.

IMPORTANT: Respecte STRICTEMENT ce format avec "Speaker R:" et "Speaker S:" au début de chaque ligne de dialogue, sinon le script ne pourra pas être traité correctement.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Tu es un expert en création de podcasts informatifs et engageants.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      });

      return { 
        script: response.choices[0].message.content,
        topic: payload.topic,
        language: language,
        speakerType: speakerType
      };
    } catch (error) {
      console.error('Error generating script:', error);
      throw new Error(`Échec de la génération du script: ${error.message}`);
    }
  }

  @Post('transcribe')
  @UseInterceptors(FileInterceptor('file'))
  async transcribeAudio(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
    try {
      if (!file) {
        throw new Error('Un fichier audio est requis');
      }

      // Créer un dossier temporaire s'il n'existe pas
      const tempDir = path.join(process.cwd(), 'temp');
      fs.ensureDirSync(tempDir);

      // Sauvegarder le fichier temporairement
      const tempFilePath = path.join(tempDir, `audio_${crypto.randomBytes(8).toString('hex')}.mp3`);
      await fs.writeFile(tempFilePath, file.buffer);

      try {
        // Vérifier que le fichier existe
        if (!fs.existsSync(tempFilePath)) {
          throw new Error('Le fichier temporaire n\'a pas été créé correctement');
        }

        // Utiliser le modèle gpt-4o-mini-audio-preview-2024-12-17 pour la transcription
        const transcription = await this.openai.audio.transcriptions.create({
          file: createReadStream(tempFilePath),
          model: 'gpt-4o-mini-audio-preview-2024-12-17',
          language: 'fr'
        });

        // Nettoyer le fichier temporaire
        await fs.remove(tempFilePath);

        return res.json({
          transcription: transcription.text
        });
      } catch (error) {
        // Nettoyer le fichier temporaire en cas d'erreur
        await fs.remove(tempFilePath);
        throw error;
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return res.status(500).json({
        error: 'Failed to transcribe audio',
        message: error.message
      });
    }
  }

  @Post('synthesize')
  async synthesize(@Body() payload: SynthesizeDto, @Res() res: Response) {
    try {
      if (!payload.script) {
        throw new Error('Le script est requis');
      }

      // Map frontend speaker types to backend format
      let speakerType = 'default';
      if (payload.speakerType) {
        const speakerTypeMap: Record<string, string> = {
          'Homme & Homme': 'homme-homme',
          'Homme & Femme': 'homme-femme',
          'Femme & Femme': 'femme-femme'
        };
        speakerType = speakerTypeMap[payload.speakerType] || 'default';
      }

      const audioContent = await this.ttsService.synthesizeSpeech(
        payload.script, 
        speakerType
      );
      
      res.set({
        'Content-Type': 'audio/mp3',
        'Content-Disposition': 'attachment; filename="speech.mp3"',
      });
      
      return res.send(audioContent);
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      return res.status(500).json({ 
        error: 'Failed to synthesize speech',
        message: error.message 
      });
    }
  }
}
