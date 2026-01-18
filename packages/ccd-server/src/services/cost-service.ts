import { db } from '../db/index';

export interface ModelPricing {
  id: number;
  model_family: string;
  input_cost_per_mtok: number;
  output_cost_per_mtok: number;
  effective_date: string;
  notes: string | null;
}

export interface CostCalculation {
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export class CostService {
  /**
   * Extract model family from full model name
   * Example: "claude-opus-4-5-20251101" -> "opus-4-5"
   */
  private static extractModelFamily(modelName: string | null): string | null {
    if (!modelName) return null;
    const match = modelName.match(/(opus|sonnet|haiku)-(\d+-\d+)/i);
    return match ? match[0].toLowerCase() : null;
  }

  /**
   * Get pricing information for a model
   */
  static getModelPricing(modelName: string | null): ModelPricing | null {
    const family = this.extractModelFamily(modelName);
    if (!family) return null;

    const stmt = db.prepare(`
      SELECT * FROM model_pricing
      WHERE model_family = ?
      ORDER BY effective_date DESC
      LIMIT 1
    `);

    return stmt.get(family) as ModelPricing | null;
  }

  /**
   * Calculate costs based on token usage and model
   */
  static calculateCost(
    inputTokens: number,
    outputTokens: number,
    modelName: string | null
  ): CostCalculation {
    const pricing = this.getModelPricing(modelName);

    if (!pricing) {
      return { inputCost: 0, outputCost: 0, totalCost: 0 };
    }

    const inputCost = (inputTokens / 1_000_000) * pricing.input_cost_per_mtok;
    const outputCost = (outputTokens / 1_000_000) * pricing.output_cost_per_mtok;

    // Round to 5 decimal places
    return {
      inputCost: Math.round(inputCost * 100000) / 100000,
      outputCost: Math.round(outputCost * 100000) / 100000,
      totalCost: Math.round((inputCost + outputCost) * 100000) / 100000
    };
  }
}
