import { Module } from '@nestjs/common';
import { AnalysisModule } from './analysis/analysis.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AuthModule,
    AnalysisModule,
  ],
})
export class AppModule {}
