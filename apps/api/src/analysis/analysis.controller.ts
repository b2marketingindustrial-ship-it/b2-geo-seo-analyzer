import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('v1/analysis-runs')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post()
  async createAnalysis(@Body() body: CreateAnalysisDto) {
    return this.analysisService.create(body);
  }

  @Get(':id')
  async getAnalysis(@Param('id') id: string) {
    return this.analysisService.findById(id);
  }

  @Get(':id/findings')
  async getFindings(
    @Param('id') id: string,
    @Query('severity') severity?: string,
    @Query('category') category?: string,
  ) {
    return this.analysisService.getFindings(id, { severity, category });
  }

  @Get(':id/scores')
  async getScores(@Param('id') id: string) {
    return this.analysisService.getScores(id);
  }

  @Get(':id/comparison')
  async getComparison(
    @Param('id') id: string,
    @Query('baseline') baseline: string,
  ) {
    return this.analysisService.compare(id, baseline);
  }

  @Post(':id/reanalyze')
  async reanalyze(@Param('id') id: string) {
    return this.analysisService.reanalyze(id);
  }

  @Post(':id/export-pdf')
  async exportPdf(@Param('id') id: string) {
    return this.analysisService.exportPdf(id);
  }

  @Get('seed/demo')
  async seedDemo() {
    return this.analysisService.seed();
  }
}

export interface CreateAnalysisDto {
  projectId: string;
  type: 'page' | 'domain' | 'ai_visibility';
  url: string;
  source: 'extension' | 'dashboard' | 'schedule' | 'api';
  modules?: string[];
  pageCaptureId?: string;
}
