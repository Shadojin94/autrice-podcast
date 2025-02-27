import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { TtsService } from './tts.service';

interface SynthesizeDto {
  script: string;
}

@Controller('tts')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}

  @Post('synthesize')
  async synthesize(@Body() payload: SynthesizeDto, @Res() res: Response) {
    try {
      const audioContent = await this.ttsService.synthesizeSpeech(payload.script);
      
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
