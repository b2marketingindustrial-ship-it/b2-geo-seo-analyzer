import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { AISemanticService } from './ai-semantic.service';

@Module({
  controllers: [AnalysisController],
  providers: [AnalysisService, AISemanticService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
