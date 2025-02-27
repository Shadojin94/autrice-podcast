import { Module } from '@nestjs/common';
import { TtsModule } from './tts/tts.module';

@Module({
  imports: [TtsModule],
})
export class AppModule {}
